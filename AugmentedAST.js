/* Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/


/* the routines in this file walk the ast that was built from a WebIDL
 * file and prepare it for processing through a Mustache compiler */

var error_codes = { duplicate_names: "duplicate_names",
		    external_inheritance: "external_inheritance" };

/* we need to keep track of all of the WebIDL constructs' names so
 * that we can detect if we see the same name used twice */
var names_seen = {};

/* that's "record" as in, "write down", rather than "plastic disk with
   music on it..." */
/* SIDE EFFECT: populates the (function-level) global variable names_seen */
var record_name = function(name, kind)
{
    /* if this is the first time we've seen this name, set up the
       new entry */
    if (names_seen[name] === undefined)
	names_seen[name] = {callback: 0, dictionary: 0, interface: 0};
    
    names_seen[name][kind]++;
} /* record_name */


AugmentedAST.error_codes = error_codes;

/* CONSTRUCTOR */
/* processes the given AST for errors, and produces an augmented
   version of the ast with easy access to the defined dictionaries,
   interfaces, types, and other definitions in the idl */
function AugmentedAST(ast, fix_type_errors, leave_enums_alone, moduleName)
{
    this.ast = ast;
    this.moduleName = moduleName;
    this.isAugmented = false;
    this.fix_type_errors = fix_type_errors;
    this.leave_enums_alone = leave_enums_alone;

    this.dictionaries = Object.create(null);
    this.callbacks = Object.create(null);
    this.interfaces = Object.create(null);
    this.exceptions = Object.create(null);
    this.enums = Object.create(null);
    this.allExternalTypes = Object.create(null);
    this.array_types = Object.create(null);
    this.variadic_types = Object.create(null);
    this.interface_names = new Array();
    this.composites = Object.create(null);
    this.typedefs = Object.create(null);

    /* we use this queue to keep track of members, etc. that we need
       to check after everything is processed */
    this.typeCheckQueue = [];

    // we use this to squash the array
    this.removedIndices = [];

    if (this.ast)
	this.augment();
    else /* this can only happen during development; even a blank .idl
	    file produces a non-empty tree... */
	throw "HEY DEVELOPER!!!  FORGET SOMETHING?!?"

} /* constructor */

/* an array of supported WebIDL primitive types */
AugmentedAST.prototype.primitiveTypes = ['any', 'ArrayBuffer', 'boolean',
					 'byte', 'octet', 'short',
					 'unsigned short', 'long',
                                         'unsigned long', 'long long',
					 'unsigned long long', 'float',
                                         'unrestricted float', 'double',
					 'unrestricted double', 'DOMString',
					 'void', 'string', 'this',
					 'object', 'Error', 'Json' ];

/* uses the augmented data to produce an array of types, including
   primitive, dictionary, interface, typedef, exception and enum types
   that have been defined/used in the idl */
AugmentedAST.prototype.generateAllowedTypesArray = function ()
{
    return this.primitiveTypes.concat(Object.keys(this.dictionaries),
                                      Object.keys(this.callbacks),
                                      Object.keys(this.interfaces),
                                      Object.keys(this.exceptions),
                                      Object.keys(this.enums),
				      Object.keys(this.typedefs));
}; /* AugmentedAST.generateAllowedTypesArray */

/* checks whether the given type is properly defined in the IDL */
/* (when this is called, we've parsed the AST and written down all of
   the types we've seen, and this function checks to see if the type
   passed in is a type we've seen -- it's sort of like a (really)
   primitive symbol table) */
AugmentedAST.prototype.isAllowedType = function (t)
{
    var tname = this.getTypeName(t);

    return this.isPrimitiveType (tname) ||
           this.isDictionaryType(tname) ||
           this.isInterfaceType (tname) ||
           this.isCallbackType  (tname) ||
           this.isExceptionType (tname) ||
           this.isEnumType      (tname) ||
           this.isExternalType  (tname) ||
           this.isTypedefType   (tname);
};

/* returns true if the given type is primitive */
/* TODO: maybe have record_typedefs() simply add those names (that devolve
   into primitives :-) into the primitiveTypes table and thus simplify
   checking here and in other places? -- I'm torn on the system-design
   question... */
AugmentedAST.prototype.isPrimitiveType = function (t)
{
    var typeName = this.getTypeName(t);

    if (typeName in this.typedefs)
	typeName = this.typedefs[typeName].ultimate_typename;

    return this.primitiveTypes.indexOf(typeName) > -1;
}; /* AugmentedAST.isPrimitiveType */

/* returns true if the given type has been defined as a dictionary in the IDL */
AugmentedAST.prototype.isDictionaryType = function (t)
{
    return this.dictionaries[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isDictionaryType */

/* returns true if the given type has been defined as an interface in the IDL */
AugmentedAST.prototype.isInterfaceType = function (t)
{
    return this.interfaces[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isInterfaceType */

/* returns true if the given type has been defined as a callback in the IDL */
AugmentedAST.prototype.isCallbackType = function (t)
{
    return this.callbacks[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isCallbackType */

/* returns true if the given type has been defined as a typedef in the IDL */
AugmentedAST.prototype.isTypedefType = function (t)
{
    return this.typedefs[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isTypedefType */

/* returns true if the given type has been defined as an exception in the IDL */
AugmentedAST.prototype.isExceptionType = function (t)
{
    return this.exceptions[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isExceptionType */

/* returns true if the given type has been defined as an enum in the IDL */
AugmentedAST.prototype.isEnumType = function (t)
{
    return this.enums[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isEnumType */

/* returns true if the given type has been defined as an external type
   in the IDL */
AugmentedAST.prototype.isExternalType = function (t)
{
    return this.allExternalTypes[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isExternalType */

/* returns true if the given type has been defined as an interface in the IDL */
AugmentedAST.prototype.isCompositeType = function (t)
{
    return this.composites[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isCompositeType */

/* adds the given type to a queue of types that need to be checked;
   the queue is checked after all definitions have been processed */
AugmentedAST.prototype.addToTypeCheckQueue = function (t)
{
    if (Array.isArray(t))
	// concat
	this.typeCheckQueue = this.typeCheckQueue.concat(t);
    else
	// push
	this.typeCheckQueue.push(t);
}; /* AugmentedAST.addToTypeCheckQueue */

/* checks that the given type is well defined; in the process, adds more
   types to check depending on the type */
AugmentedAST.prototype.checkType = function (t)
{
    // t could be an operation, attribute, constant member.
    if (t.type === 'operation')
    {
	// check return type
	this.addToTypeCheckQueue(t.idlType);
	// check argument types
	this.addToTypeCheckQueue(t.arguments);
    }
    else if (t.type === 'typedef')
    {
	this.addToTypeCheckQueue(t.name);
	this.addToTypeCheckQueue(t.idlType);
    }
    else if (t.type === 'attribute')
    {
	this.addToTypeCheckQueue(t.idlType);
    }
    else if (t.type === 'const')
    {
	// TODO Support constants
    }
    else if (t.idlType)
    {
	this.addToTypeCheckQueue(t.idlType);
    }
    /* Javascript supports two "types" of "strings" (literal strings and
       those created with new (i.e., "var x = new String"), so that's why
       this check is written this way... */
    else if ((typeof t === 'string' || t instanceof String) &&
	     (this.isAllowedType(t)))
    {
	// it could also be a string representing a type (base case)
    }
    else
    {
	throw "Unsupported type: " + t;
    }
    
    /* fall through means this was a legal type */
    return true;
}; /* AugmentedAST.checkType */


/* if it's a basic C type, then return a default value for that type;
   otherwise, create and return a call to that thing's constructor */
AugmentedAST.prototype.get_C_default_value = function(C_Type)
{
    let intrinsic_C_Types2 = {  int8_t:   0    ,
			       uint8_t:  0    ,
			       int16_t:  0    ,
			       uint16_t: 0    ,
			       int32_t:  0    ,
			       uint32_t: 0    ,
			       int64_t:  0    ,
			       uint64_t: 0    ,
			       float:    0.0  ,
			       double:   0.0  ,
			       string: "\"\"" ,
			       bool:     false,
			       ArrayBuffer: "NULL",
			    };
    let intrinsic_C_Types = {  byte:   0    ,
			       octet:  0    ,
			       short:  0    ,
			       "unsignedshort": 0    ,
			       long:  0    ,
			       "unsignedlong": 0    ,
			       "longlong":  0    ,
			       "unsignedlonglong": 0    ,
			       float:    0.0  ,
			       double:   0.0  ,
			       "DOMString": "\"\"" ,
			       string: "\"\"" ,
			       "ByteString": "\"\"" ,
			       "USVString": "\"\"" ,
			       bool:     false,
			       boolean: false,
			       Error: "\"\"" ,
			    };
    if (this.typedefs[C_Type] != undefined)
	C_Type = this.typedefs[C_Type].ultimate_typename;

    if (Object.keys(intrinsic_C_Types).indexOf(C_Type) >= 0)
	return intrinsic_C_Types[C_Type];
    else
	return C_Type + "_constructor()";
} /* AugmentedAST.get_C_default_value */


AugmentedAST.prototype.WebIDL_to_Jerryscript_TypeMap = {
	"any": "any",
	"ArrayBuffer"         : "ArrayBuffer",
	"boolean"             : "boolean",
	"byte"                : "number",
	"octet"               : "number",
	"short"               : "number",
	"unsigned short"      : "number",
	"long"                : "number",
	"unsigned long"       : "number",
	"long long"           : "number",
	"unsigned long long"  : "number",
	"float"               : "number",
	"unrestricted float"  : "number",
	"double"              : "number",
	"unrestricted double" : "number",
    "DOMString"               : "string",
	"ByteString"          : "string",
	"USVString"           : "string",
        "Error"               : "Error",
	"this"                : "this"
    }; /* WebIDL_to_Jerryscript_TypeMap */

AugmentedAST.prototype.WebIDL_to_C_TypeMap = {
	"any" : "any",
	"ArrayBuffer": "ArrayBuffer",
	"boolean" : "boolean",
	"byte" : "byte",
	"octet" : "octet",
	"short" : "short",
	"unsigned short" : "unsignedshort",
	"long" : "long",
	"unsigned long" : "unsignedlong",
	"long long" : "longlong",
	"unsigned long long" : "unsignedlonglong",
	"float" : "float",
	"unrestricted float" : "unrestricted_float",
	"double" : "double",
	"unrestricted double" : "unrestricted_double",
	"DOMString" : "DOMString",
	"ByteString" : "ByteString",
	"USVString" : "USVString",
	"string" : "string",
        "Error" : "Error",
	"this" : "this"
    }; /* WebIDL_to_C_TypeMap */

AugmentedAST.prototype.WebIDL_to_C_TypeMap2 = {
	"any" : "any",
	"ArrayBuffer": "ArrayBuffer",
	"boolean" : "bool",
	"byte" : "int8_t",
	"octet" : "uint8_t",
	"short" : "int16_t",
	"unsigned short" : "uint16_t",
	"long" : "int32_t",
	"unsigned long" : "uint32_t",
	"long long" : "int64_t",
	"unsigned long long" : "uint64_t",
	"float" : "float",
	"unrestricted float" : "float",
	"double" : "double",
	"unrestricted double" : "double",
	"DOMString" : "string",
	"ByteString" : "string",
	"USVString" : "string",
	"string" : "string",
        "Error": "Error",
	"this" : "jerry_value_t"
    }; /* WebIDL_to_C_TypeMap2 */


/* record all of the names of typedefs in our input; 
/* SIDE EFFECT: creates the AugmentedAST.typedefs list */
AugmentedAST.prototype.record_typedefs = function(ast)
{
    this.typedefs = new Object;

    /* SIDE EFFECT: sets the "parent" and "ultimate_typename" fields of
       "current" in the "typedefs" list */
    /* this is, essentially, a union-find algorithm; we walk up
       "current"'s tree until we hit the parent -- this is "current"'s
       actual type */
    /* this function raises an exception if a loop is found -- we
       know we've looped if the "tree_members" array contains "current" */
    let find_ultimate_typename = function(current, typedefs_list, tree_members)
    {
	if (tree_members.includes(current))
	{
	    /* TODO: print out the members of the loop */
	    throw new Error("Loop in typedefs.");
	}

	if (typedefs_list[current].ultimate_typename === undefined)
	{
	    /* (b/c a typedef is just an alias between names) */
	    let alias = typedefs_list[current].type;

	    if (alias in typedefs_list)
	    {
		tree_members.push(current);

		typedefs_list[current].ultimate_typename =
		    find_ultimate_typename(alias, typedefs_list, tree_members);
	    }
	    else
		typedefs_list[current].ultimate_typename = alias; 
	}
	return typedefs_list[current].ultimate_typename;
    } /* find_ultimate_typename */

    /* first, gather the typedefs */
    for(var i = 0; i < ast.length; i++)
	if (ast[i].type == "typedef")
        {
	    this.set_external_types(ast[i]);

	    /* this sets the "name" field in the idlType structure so
	       that we can save it -- we send in an empty mapping array,
	       b/c we are just going to record the WebIDL type */
	    let base_type = this.idlTypeToOtherType(ast[i].idlType, []);

	    this.typedefs[ast[i].name] = {name: ast[i].name,
				          type: base_type};


	    this.addToTypeCheckQueue(ast[i]);
	}

    /* second, build a tree of typedefs and figure out what type they're
       ultimately aliased to -- b/c it's perfectly okay to typedef a->b->c...
       and we need to know what the "ultimate" type is so that we can
       include the proper .h file to support its use */
    let types = Object.keys(this.typedefs);
    for(var i = 0; i < types.length; i++)
	find_ultimate_typename(types[i], this.typedefs, []);

} /* record_typedefs */


/* return a struct with the C and Jerryscript types for the WebIDL type
   passed in */
AugmentedAST.prototype.getConversionTypes = function(idlType,
						     is_variadic = false)
{
    let return_types = {};

    return_types.Jerryscript_Type =
	                this.idlTypeToOtherType(idlType,
				            this.WebIDL_to_Jerryscript_TypeMap,
				            is_variadic);
    return_types.C_Type = this.idlTypeToOtherType(idlType,
					    this.WebIDL_to_C_TypeMap,
					    is_variadic);

    /* the "this" pointer can only occur (in the WebIDL) as the return
       type of a function; mark it here for easy identification */
    if (return_types.Jerryscript_Type === "this")
	return_types.return_is_this = true;

    /* strings are messy in C, so mark them for special handling later */
    if (return_types.Jerryscript_Type === "string")
	return_types.is_string = true;

    /* (for callbacks, both the C and Jerryscript types will be the same,
       so it doesn't matter which one we look at) */
    /* TODO: AT THIS POINT, DO WE KNOW ALL OF THE TYPES' KINDS? */
    if (this.isCallbackType(return_types.C_Type))
    {
	return_types.callback = true;
	return_types.callback_return_type = this.callbacks[this.getTypeName(return_types.C_Type)].return_type;
    }

    /* on the C side, we'll want to know what the default value is
       when defining a variable of that type -- intrinsic types have
       a value, while everything else has a constructor */
    return_types.default_value = this.get_C_default_value(return_types.C_Type);

    /* TODO: handle arrays */
    if (idlType.array > 0)
	return_types.is_array = true;

    return return_types;
}; /* AugmentedAST.getConversionTypes */


/* look through "thing"'s external attributes and see if any are specifying
   references to types defined in other places */
/* SIDE EFFECT: adds the externalTypes array to "thing" */
AugmentedAST.prototype.set_external_types = function(thing)
{
    thing.externalTypes = new Array();

    for (let extAttr of thing.extAttrs)
    {
	/* so the parser will let the extAttrs array have entries that
	   are undefined -- this is a bug in the parser we should chase
	   down, but there are only three places where this matters, so
	   we'll just check for it in those three places, for now; TODO */
	if (extAttr === undefined)
	    continue;

	if (extAttr.name != undefined &&
	    (extAttr.name == "ExternalCallback" ||
	     extAttr.name == "ExternalInterface" ||
	     extAttr.name == "ExternalDictionary"))
	{
            if (extAttr.rhs == undefined ||
		extAttr.rhs.value == undefined ||
		extAttr.rhs.value.length != 1)
            {
		throw new Error("External type declarations take a single parameters representing the name of the type.");
            }
            else
            {
		/* for the local list attached to the "thing" object and
		 * the global list attached to the "this" object, if
		 * it's not a duplicate, add it */
		var type_name = extAttr.rhs.value[0];
		let is_callback = (extAttr.name === "ExternalCallback");
		var type_struct = { type:    type_name,
				    is_callback: is_callback};
		
		thing.externalTypes.push(type_struct);

		if (extAttr.name === "ExternalInterface")
		    this.interface_names.push(type_name);

		this.allExternalTypes[type_name] = type_struct;
            }
	}
    }
} /* AugmentedAST.set_external_types */


/* look through "thing"'s external attributes and see if the user has
   specified that this thing is to be created by "require" rather than "new" */
/* SIDE EFFECT: sets "is_module" flag for "thing" */
AugmentedAST.prototype.set_is_module = function(thing)
{
    thing.is_module = false;

    for (let extAttr of thing.extAttrs)
    {
	/* so the parser will let the extAttrs array have entries that
	   are undefined -- this is a bug in the parser we should chase
	   down, but there are only three places where this matters, so
	   we'll just check for it in those three places, for now; TODO */
	if (extAttr === undefined)
	    continue;

	if (extAttr.name != undefined &&
	    extAttr.name == "ReturnFromRequire")
	    thing.is_module = true;
    }
} /* AugmentedAST.set_is_module */



/* for the C file for each dictionary, callback, and interface, we'll
   need to include all of the other types' .h files, so build a list
   of the includes that this thing's .c/.h files will need to include */
/* we assume that any Primitive type is a non-intrinsic, but then
   we'll divide the list between non-intrinsics that are defined in
   this .idl file and those that have an explicit ExternalType
   attribute; we assume that the ExternalTypes has already been built
   for this thing, so as a final step of this function, we'll remove
   everything in the ExternalTypes list from the intrinsics type
   list */
/* SIDE EFFECT: sets the non_intrinsic_types list on "thing" */
/* SIDE EFFECT: sets the typedefs list on "thing" */
/* Note that this could put a type in the thing's externalTypes array
  even though that type is included later in this compilation
  (so it is a locally defined non-intrinsic-type rather than
  an external type) -- at this point in the code, we haven't seen all
  of the types, so we'll have to come back later and (perhaps) move
  some things in the externalTypes list back to the
  non_intrinsic_types list */
AugmentedAST.prototype.get_non_intrinsic_types_list = function(thing)
{
    let add_to_lists_if_not_primitive =
	               function(this_ptr, type, intrinsics_list, typedefs_list)
    {
	/* typedefs need both their own name and their (non-primitive) ultimate-
	   type added to the list */
	if (type in this_ptr.typedefs)
	{
	    /* keep track of what we've seen */
	    if (typedefs_list[type] === undefined)
	    {
		typedefs_list[type] = type;
		intrinsics_list.push({type_name: type,
				      needs_initialization: false});
	    }
	    type = this_ptr.typedefs[type].ultimate_typename;
	}
	else if (type === "ArrayBuffer")
	    type = "byte_array";

	if (!(this_ptr.isPrimitiveType(type)))
	    intrinsics_list.push({type_name: type,
				  needs_initialization: true});
    }; /* add_to_lists_if_not_primitive */

    /* look at the return type and the arguments to the call */
    let process_call = function(this_ptr, intrinsics_list, call, typedefs_seen)
    {
	// examine the return type
	let return_type = this_ptr.get_idlType_string(call.idlType);

	add_to_lists_if_not_primitive(this_ptr, return_type, intrinsics_list, typedefs_seen);

	// examine the types of the arguments
	for (let j = 0; j < call.arguments.length; j++)
	{
	    let argument = call.arguments[j];
	    let argument_type = argument.idlType.name;
	    /* TODO: do we need the following variable? */
	    let argument_type2 = this_ptr.get_idlType_string(argument.idlType);
	    
	    add_to_lists_if_not_primitive(this_ptr, argument_type,
					 intrinsics_list, typedefs_seen);
 	}
    }; /* process_call */

    /* we want to put typedefs out in the order that they
       will need to be put out in the .h file, so walk up each tree
       and make sure that parents get into the list before their children */
    let gather_typedefs = function(global_typedefs_list, local_typedefs_list)
    {
	let seen = [];
	let typedefs_in_order = []

	/* walks up each typedef's tree, adding all of the parents as well
	   as the typedef itself to the list of typedefs that will need to
	   be put out for "thing" */
	let walk_up_tree =
	           function(current, typedefs_list, global_typedefs_list, seen)
	{
	    if (seen.includes(current))
		return;
	    else
	    {
		seen[current]= true;
		let parent = global_typedefs_list[current].type;
		if (parent in global_typedefs_list)
		    walk_up_tree(parent, typedefs_list,
				 global_typedefs_list, seen);
		/* we add "current" in a post-order fashion, because
		   we are going to put out the typedefs in parent-first
		   order */
		typedefs_list.push({"name": current, "type":global_typedefs_list[current].type});
	    }
	} /* walk_up_tree */

	for (var i in local_typedefs_list)
	    walk_up_tree(local_typedefs_list[i], typedefs_in_order,
			 global_typedefs_list, seen);
	return typedefs_in_order;
    } /* gather_typedefs */

    let intrinsics_list = [];
    let typedefs_seen = new Object;

    /* for interfaces, we have to look at each attribute's type and at
       each operation's return type and parameter types */
    if (thing.type == "interface")
    {
	for (let i = 0; i < thing.operations.length; i++)
	{
	    let operation = thing.operations[i];
	    process_call(this, intrinsics_list, operation, typedefs_seen);
	}
	/* examine the attributes (just struct fields, so they're easy) */
	for (let i = 0; i < thing.attributes.length; i++)
	{
	    let attribute = thing.attributes[i];
	    let attribute_type = this.get_idlType_string(attribute.idlType);

	    add_to_lists_if_not_primitive(this, attribute_type,
					  intrinsics_list, typedefs_seen);
	}
    }

    /* callbacks work the same way as an interface's operations */
    else if (thing.type == "callback")
	process_call(this, intrinsics_list, thing, typedefs_seen);

    /* dictionaries are easy: look at each field's type */
    else if (thing.type == "dictionary")
    {
	for (let i = 0; i<thing.members.length; i++)
	{
	    let field = thing.members[i];
	    let field_type = this.get_idlType_string(field.idlType);

	    add_to_lists_if_not_primitive(this, field_type,
					  intrinsics_list, typedefs_seen);
	}
    }

    /* similar to dictionaries, composites are just lists of other types,
       so we need to loop through them and build up the list */
    else if (thing.type === "composite")
    {
	var type_list = thing.webidl_type_list;

	for (let i = 0; i<type_list.length; i++)
	    add_to_lists_if_not_primitive(this, type_list[i],
					  intrinsics_list, typedefs_seen);
    }

    else
	/* TODO: throw an actual exception; not really all that important
	   right now, as this can only happen (?) during development; once
	   we're parsing WebIDL files, this clause won't ever get hit */
	console.log("ERROR in call to get_non_intrinsice_types_list");

    /* unique-ify the list of types */
    /* the following line was my first attempt:
    /* let uniq_list =
	    intrinsics_list.filter(function(item, pos)
	                      {return intrinsics_list.indexOf(item)==pos;});*/
    /* ...but this fails, b/c indexOf doesn't like objects (it's the perennial
       difference between == and ===) -- so I substituted the following, which
       I got off of http://tinyurl.com/yabbcs8v : */
    let uniq_list = []; uniq_list = intrinsics_list.filter(
	     function(item, position)
	     {
		 return position === 
		    (pos => intrinsics_list.findIndex(x => x.type_name === pos))
		    (item.type_name)
	     }
    );
    /* ...we rely on findIndex instead of indexOf, wrapping it in an
       anonymous function and wrapping that function in parens to instantly
       call it with the parameters sent in by intrinsics_list.filter */

    /* TODO: make sure that callbacks, dictionaries, and composite types
       have an externalTypes list built */
    /* cull explicitly external types from the list of types */
    /* NOTE: assumes that thing.externalTypes has been set up! */thing.non_intrinsic_types = [];
    thing.non_intrinsic_types = uniq_list.filter(
	            function(item){return this.indexOf(item.type_name)<0;},
                    thing.externalTypes.map(function(x) {return x.type;} ));

    thing.typedefs = gather_typedefs(this.typedefs, typedefs_seen);

} /* AugmentedAST.prototype.get_non_intrinsic_types_list */



/* for dictionaries, string default values need to be surrounded by quotes
   so that they'll output correctly */
AugmentedAST.prototype.find_default_string_values = function(d)
{
    for (var index in d.members)
	if (d.members[index].default &&
	    d.members[index].default.type === "string") 
	    d.members[index].default.is_string = true;
} /* AugmentedAST.find_default_string_values */


/* if a WebIDL variable name is a C reserved word, the code won't
   compile -- to fix this, we'll check every parameter, struct field,
   etc. to make sure that it is not a reserved word, and if it is,
   then we'll add a trailing underscore to make the code compilable;
   we'll do the same for WebIDL names (necessary?) and we'll skip
   Javascript reserved words, for now */
/* NOTE: this function should never be called for typedefs! */
/* this function returns either the name passed in or the name with a '_'
   appended to it */
/* TODO: it was only after this infrastructure was built that I
   realized that I need to also "reserve" any type name in the .idl
   also -- this should be done with a single global pass instead of
   the kludge of building the "local" list of reserved words the first
   time this function is called -- note that external types whose
   files are not included could have name conflicts, too: the docs
   should have an explanation of the problem and an example of the
   error message from the compiler */
AugmentedAST.prototype.local_reserved_words = [];
AugmentedAST.prototype.fix_names = function(thing)
{

    /* kludge: build the list of local type names the first time this
       function is called */
    if (this.local_reserved_words.length == 0)
    {
	/* we want to put a meaningless string onto the list so this
	   code is called exactly once; we'll use a string that can't be
	   a WebIDL type name so that this entry will never match */
	this.local_reserved_words.push("2");

	/* the ast the parser builds is really, really simple -- each
	   construct has a "name" field... */
	for(let i = 0; i < this.ast.length; i++)
	    this.local_reserved_words.push(this.ast[i].name);
    }

    /* TODO: is it ineffecient not to make this and the next array global? */
    let C_reserved_words = [ "auto", "break", "case", "char", "const",
			     "continue", "default", "do", "double",
			     "else", "enum", "extern", "float", "for",
			     "goto", "if", "inline", "int", "long",
			     "register", "restrict", "return", "short",
			     "signed", "sizeof", "static", "struct",
			     "switch", "typedef", "union", "unsigned",
			     "void", "volatile", "while" ];

    /* I think the only WebIDL words we care about are those that
       describe types", since some of the WebIDL type names propagate
       through to the C code */
    let WebIDL_reserved_words = [ "any", "boolean", "byte", "octet",
				  "short", "unsignedshort", "long",
				  "unsignedlong", "longlong",
				  "unsignedlonglong", "float",
				  "unrestrictedfloat", "double",
				  "unrestricteddouble", "DOMString",
				  "ByteString", "USVString", "object",
				  "symbol", "Promise", "Error" ];

    let local_reserved_words = this.local_reserved_words;

    /* this is the fixer for every name in the file... */
    let fix_name = function(name, variable_name = true)
    {
	/* a "while" loop is probably overkill, but it should still be done */
	while (C_reserved_words.indexOf(name) >= 0 ||
	       WebIDL_reserved_words.indexOf(name) >= 0 ||
	       (variable_name && local_reserved_words.indexOf(name) >= 0))
	    name += "_";

	return name;
    } /* fix_name */

    /* b/c enums are sets of strings, it's perfectly okay to have enum
       values that are restricted in any of our three languages; this
       routine will rewrite disallowed enum values to slightly altered
       strings that will be legal in all three languages */
    let fix_enum = function(enum_string)
    {
	let return_string = enum_string;

	/* this is the list of special characters and the string
	   replacements for each */
	/* TODO: the current implementation is only a partial list: */
	/* TODO: document these! */
	let replacements = [ {"target": "+", "replace_with": "_plus" },
			     {"target": "-", "replace_with": "_minus" },
			     {"target": "*", "replace_with": "_mult" },
			     {"target": "/", "replace_with": "_slash" },
			   ];

	/* replace spaces with underscores */
	return_string = return_string.replace(/\s+/g, '_');

	/* convert special characters to words */
	/* note: this comes before looking for reserved words, b/c some of
	   the special characters are interpreted as regular-expression
	   characters, which match when they shouldn't */
	for (let i = 0; i < replacements.length; i++)
	    return_string = return_string.split(replacements[i].target).
	                                  join(replacements[i].replace_with);

	/* concatenate a "_" onto reserved words */
	return fix_name(return_string);
    } /* fix_enum */

    /* callbacks and operations work the same way, so we've abstracted out
       their code */
    let process_call_arguments = function(call)
    {
	// fix argument names
	for (let j = 0; j < call.arguments.length; j++)
	    call.arguments[j].name = fix_name(call.arguments[j].name);
    }; /* process_call_arguments */

    thing.name = fix_name(thing.name,
			  false /* don't compare thing names
				  against type names defined in the
				  file (since that list is made up of
				  just these names, and they'll get
				  (incorrectly) modified) */ );
    /* for interfaces, we have to look at each attribute's type and at
       each operation's return type and parameter types */
    if (thing.type == "interface")
	for (let i = 0; i < thing.members.length; i++)
	{
	    let member = thing.members[i];

	    member.name = fix_name(member.name);
	    if (member.type === "operation")
		process_call_arguments(member);
	    else /* member.type === "attribute" */
		; /* nothing more to be done for attributes */
	}

    /* callbacks work the same way as an interface's operations */
    else if (thing.type == "callback")
	process_call_arguments(thing);

    else if (thing.type === "dictionary")
	for (let i = 0; i<thing.members.length; i++)
	    thing.members[i].name = fix_name(thing.members[i].name);

    else if (thing.type === "typedef")
	throw "ERROR: CALL TO fix_names FOR TYPEDEF DECLARATION.";

    else if (thing.type === "enum")
	for(let i = 0; i <  thing.values.length; i++)
	    thing.values[i] = fix_enum(thing.values[i]);

    else
	/* TODO: throw an actual exception; not really all that important
	   right now, as this can only happen (?) during development; once
	   we're parsing WebIDL files, this clause won't ever get hit */
	console.log("ERROR in call to fix_names.");

} /* fix_names */



/**
 * Adds a dictionary to our map of dictionaries
 * @param d The original ast dictionary object
 * @param index The index this dictionary is in the original ast
 * @returns {boolean} True if added successfully, false otherwise.
 */
/* CAUTION: any changes to this function should be reflected in
 * similar changes to convert_list_of_array_types_to_dictionaries,
 * which builds dictionaries by hand */
/* TODO: change convert_list_of_array_types_to_dictionaries to build
 * an AST for each array and then just call this function */
AugmentedAST.prototype.addDictionary = function (d, index)
{

/*
  In the AST, a dictionary looks like this:
    { type: 'dictionary', 
      name: 'Di', 
      partial: false, 
      members: [ [Object],[Object] ], 
      inheritance: null, 
      extAttrs: [] }
 */
    this.fix_names(d);
    record_name(d.name, "dictionary");

    this.set_external_types(d);

    // does the dictionary already exist?
    var existingDict = this.dictionaries[d.name];
    // TODO: handle existing Dict in the presence of an error of having
    // two dictionaries with the same name...
    if (0 && existingDict)
    {
	// exists. Augment if partial, otherwise throw
	if (d.partial)
	{
	    existingDict.members = existingDict.members.concat(d.members);
	    // add the new members to the check queue
	    //      console.log("addDictionary:");
	    //      console.log("    existingDict, d.members");
	    this.addToTypeCheckQueue(d.members);
	    // get rid of duplicates; index is less-than-zero for arrays
	    // that we create
	    if (index > 0)
	    {
		this.ast[index] = null;
		this.removedIndices.push(index);
	    }
	}
	else 
	{
	    return;
	    // OLD CODE:
	    throw "The dictionary already exists: " + d.name;
	}
    }
    else // doesn't exist. Add it as a new key. 
    {
	this.dictionaries[d.name] = d;
	d.dictionaryName = d.name;
	// augment and add members
	for(var i = 0 ; i < d.members.length; i++){
	    d.members[i].memberName = d.members[i].name;
	                                           /* "name" is too generic */
	    d.members[i].C_and_Jerryscript_Types = this.getConversionTypes(d.members[i].idlType);
	    if (i+1 == d.members.length)
		d.members[i].finalMember = true;
	}
	//    console.log("    NOT existingDict, d.members");
	this.addToTypeCheckQueue(d.members);
    }
    
    // add an index to the dictionary members so it's easy to assign
    // to them when the user does a new
    for(var i = 0 ; i < d.members.length; i++)
	d.members[i].member_index = i;
    
    // get a list of types that will need to be included in the .c file for this
    // dictionary
    this.get_non_intrinsic_types_list(d);

    /* string default values need to be marked so that we'll know to
       output surrounding quotes */
    this.find_default_string_values(d);
    
    return true;
}; /* addDictionary */


/* enum strings can be the same across multiple enum declarations, so
   we need a way to unique'ify them; as a start, we'll add the name of
   the enumeration type onto each enum value */
AugmentedAST.prototype.expand_enums = function(new_enum)
{
    let enum_name = new_enum.name;

    for(let i = 0; i < new_enum.values.length; i++)
	new_enum.values[i] = enum_name + "_" + new_enum.values[i];
} /* expand_enums */


/**
 * Adds an enum object to our map of enums
 * @param d The original ast dictionary object
 * @param index The index this dictionary is in the original ast
 * @returns {boolean} True if added successfully, false otherwise.
 */
AugmentedAST.prototype.addEnum = function (new_enum, index) {
  //A enumeration declaration looks like this:
  //{ type: 'enum', name: 'name', values: [ [string], [string], ... ], extAttrs: [] }

    if (!this.leave_enums_alone)
	this.expand_enums(new_enum);
    this.fix_names(new_enum);

  // does the enum name already exist?
  var existingEnum = this.enums[new_enum.name];
    // TODO: handle existing enums in the face of an error of having two
    // named the same
  if (0 && existingEnum) {
      /* OLD CODE */
      ;//throw "The enum already exists: " + new_enum.name;
  } else {
      // doesn't exist. Add it as a new key.
      new_enum.enumName = new_enum.name;
      this.enums[new_enum.name] = new_enum;

    // augment and add members
    new_enum.number_of_members = new_enum.values.length; // needed for mustache'ing
    if (new_enum.number_of_members == 0)
	throw "Enumeration type with no values is not allowed";
    else if (new_enum.number_of_members == 1)
	  new_enum.onlyOneMember = true;

    new_enum.members = [];
    for(var i = 0 ; i < new_enum.number_of_members; i++){
	let new_object = {name    : new_enum.values[i],
			  new_line: "\n"};
	if (i === 0)
	    new_object.indentation = "";
	else
	    new_object.indentation = new Array("typedef enum {  ".length).join( " " );
	if (i+1 === new_enum.number_of_members)
	    new_object.finalMember = true;
	    
	new_enum.members.push(new_object);
    }
  }
  return true;
}; /* addEnum */



/**
 * Adds a callback to our map of callbacks
 * @param d The original ast callback object
 * @param index The index this callback is in the original ast
 * @returns {boolean} True if added successfully, false otherwise.
 */
AugmentedAST.prototype.addCallback = function (callback, index) {
  //A callback looks like this:
  //{ type: 'callback', name: '<name>', idlType,
  //  arguments: [ { optional: bool, variadic: bool,
  //	             extAttrs: [], idlType, name: ' ' } ],
  //  extAttrs: [] }

    this.fix_names(callback);
    record_name(callback.name, "callback");

  // does the callback already exist?...if so, throw an exception
  var existingCallback = this.callbacks[callback.name];
  if (0 && existingCallback)
      throw "The callback already exists: " + callback.name;
  else
  {
    // doesn't exist. Add it as a new key.
    callback.callbackName = callback.name;
    delete callback.name; /* this avoids confusion in the Hogan compiler */
    if (Object.keys(this.callbacks).length === 0)
	callback.first_in_list = true;
    this.callbacks[callback.callbackName] = callback;
    callback.return_type = this.getConversionTypes(callback.idlType);
    if (callback.return_type.C_Type === "void")
	callback.voidReturnType = true;

    // purely for human-readability: figure out how to nicely format
    // the arguments (crude for now...)
    // the string will look like: "typedef <type> (*<name>) (", so
    // we need length("typedef ") + length(<type>)...
    var indentation_amount = "typedef ".length +
	                     callback.return_type.C_Type.length +
	                     " (*".length +
	                     callback.callbackName.length +
	                     ") ( ".length;
    callback.indentation = new Array(indentation_amount-2).join( " " );
    indentation_amount += "_wrapper".length;
    callback.wrapper_indentation = new Array(indentation_amount+1).join( " " );

    // arguments with type info
    for(var i = 0 ; i < callback.arguments.length; i++)
    {
      callback.arguments[i].C_and_Jerryscript_Types = this.getConversionTypes(callback.arguments[i].idlType, callback.arguments[i].variadic);

      callback.arguments[i].paramIndex = i;
      if (i+1 === callback.arguments.length)
	  callback.arguments[i].separator = ")";
      else
	  callback.arguments[i].separator = ",\n";

      if (i === 0)
	  callback.arguments[i].firstArgument = true;

      if ((i+1) === callback.arguments.length)
	  callback.arguments[i].finalArgument = true;
	  
    }
    this.addToTypeCheckQueue(callback.idlType);
    this.addToTypeCheckQueue(callback.arguments);

    this.set_external_types(callback);

  // get a list of types that will need to be included in the .c file for this
  // callback
    this.get_non_intrinsic_types_list(callback);
  }

  return true;
}; /* addCallback */


/* I want to remove dictionaries that contain source code for the
   target files, and this seems to be a reasonable method: */
/* note that it only works when the indices are numbers, and
   it can't be used inside a for(var i in array) loop... */
// Array Remove - By John Resig (MIT Licensed)
// http://ejohn.org/blog/javascript-array-remove/
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


/**
 * Adds a member of an interface to the interface.
 * This is used to allow easy access to the operations of the interface later on.
 * @param interfaceName
 * @param interfaceMember
 */
AugmentedAST.prototype.addInterfaceMember = function (interfaceName, interfaceMember)
{
    if (this.interfaces[interfaceName] === undefined)
	throw "The interface does not exist: " + interfaceName;

    if (interfaceMember.type === 'operation')
    {
	interfaceMember.operationName = interfaceMember.name;
	delete interfaceMember.name;/* this avoids confusion in the
					     Hogan compiler */
	// we add schema type info to the operation first
	interfaceMember.C_and_Jerryscript_Types =
	                     this.getConversionTypes(interfaceMember.idlType);

	if (interfaceMember.C_and_Jerryscript_Types.C_Type === "void")
	    interfaceMember.voidReturnType = true;

	/* TODO: WHY?!? */
	interfaceMember.interfaceName = interfaceName;

	if(interfaceMember.extAttrs && interfaceMember.extAttrs.length > 0)
	    for(var i = 0; i < interfaceMember.extAttrs.length; i++)
		if(interfaceMember.extAttrs[i].name == "ThrowsRPCError")
		    interfaceMember.ThrowsRPCError = 
			                           interfaceMember.extAttrs[i];

	for(i = 0; i < interfaceMember.arguments.length; i++)
	{
	    interfaceMember.arguments[i].C_and_Jerryscript_Types =
		 this.getConversionTypes(interfaceMember.arguments[i].idlType, 
					 interfaceMember.arguments[i].variadic);
	    interfaceMember.arguments[i].paramIndex = i;
	    if(i == interfaceMember.arguments.length-1)
		/* only the last item in a list is marked with this
		   field; this lets us make a comma-separated list (by
		   not putting a comma after this last item) inside of
		   Hogan */
		interfaceMember.arguments[i].finalParam = true;
	}
	this.interfaces[interfaceName].operations.push(interfaceMember);
    }
    
    else if (interfaceMember.type === 'attribute')
    {
	var attributeMember = new Object;
	attributeMember.attributeName = interfaceMember.name;
	delete interfaceMember.name; /* this avoids confusion in the
					     Hogan compiler */
	attributeMember.idlType = interfaceMember.idlType;
	attributeMember.C_and_Jerryscript_Types =
	                    this.getConversionTypes(interfaceMember.idlType);

	this.interfaces[interfaceName].hasAttributes = true;
	this.interfaces[interfaceName].attributes.push(attributeMember);
    }

}; /*AugmentedAST.addInterfaceMember */

/**
 * Adds an array of members to the interface.
 * @param interfaceName
 * @param interfaceMembers
 */
AugmentedAST.prototype.addInterfaceMembers = function (interfaceName, interfaceMembers) {
//    console.log("addInterfaceMembers");
//    console.log("    interfaceMembers");
    this.addToTypeCheckQueue(interfaceMembers);
    for (var i = 0; i < interfaceMembers.length; i++)
	this.addInterfaceMember(interfaceName, interfaceMembers[i]);
}; /* addInterfaceMembers */


/* returns true if the interface has the NoInterfaceObject external attribute set */
AugmentedAST.prototype.has_NoInterfaceObject_set = function (extAttrs)
{
    for (var i = 0; i < extAttrs.length; i++)
    {
	/* so the parser will let the extAttrs array have entries that
	   are undefined -- this is a bug in the parser we should chase
	   down, but there are only three places where this matters, so
	   we'll just check for it in those three places, for now; TODO */
	if (extAttrs[i] === undefined)
	    continue;

	if (extAttrs[i].name === 'NoInterfaceObject')
	    return true;
    }
    return false;
};  /* AugmentedAST.has_NoInterfaceObject_set */


/**
 * Adds a new interface to our map of interfaces.
 * Creates a new key, and creates an empty array of operations for that key for easy access later on.
 * @param newInterface
 */
AugmentedAST.prototype.addNewInterface = function (newInterface) {
    if (this.has_NoInterfaceObject_set(newInterface.extAttrs))
      newInterface.NoInterfaceObject = true;
  newInterface.operations = [];
  newInterface.attributes = [];
  newInterface.interfaceName = newInterface.name;
  delete newInterface.name; /* this avoids confusion in the
				    Hogan compiler */
  this.interfaces[newInterface.interfaceName] = newInterface;
  this.interface_names.push(newInterface.interfaceName);
  this.addInterfaceMembers(newInterface.interfaceName, newInterface.members);

  // add an index to the interface attributes so it's easy to assign
  // to them when the user does a new
  for(var i = 0 ; i < newInterface.attributes.length; i++)
      newInterface.attributes[i].attribute_index = i;

  if (newInterface.attributes.length > 0)
      newInterface.attributes[newInterface.attributes.length-1].final_attribute = true;
}; /* AugmentedAST.addNewInterface */

/**
 * Adds a partial interface to the existing interface, then removes the original definition from the original ast.
 * @param partialInterface The original partial interface object from the original ast.
 * @param index The index the object is in the original ast (used for removing).
 */
AugmentedAST.prototype.addToExistingInterface = function (partialInterface, index) {
  var existingI = this.interfaces[partialInterface.interfaceName];
  if (existingI && partialInterface.partial) {
    existingI.members = existingI.members.concat(partialInterface.members);
    existingI.externalTypes = existingI.externalTypes.concat(partialInterface.externalTypes);
    /* cull repeats: */
    existingI.externalTypes = existingI.externalTypes.filter(
	  function(item, pos){return
			      existingI.externalTypes.indexOf(item)==pos;});
    this.addInterfaceMembers(partialInterface.interfaceName,
			     partialInterface.members);

    // remove partial definition
    this.ast[index] = null;
    this.removedIndices.push(index);
  } else {
    ;// OLD CODE: throw "The interface already exists: " + partialInterface.interfaceName;
  }

}; /* addToExistingInterface */

/**
 * Adds a new or partial interface to the map.
 * @param theInterface the original interface object from the original ast.
 * @param index The index the object is in the original ast.
 * @returns {boolean} Returns true if added successfully, false otherwise.
 */
AugmentedAST.prototype.addInterface = function (theInterface, index, fix_type_errors) {
  //An interface looks like this:
  //{type:'interface', name:'In', partial:false, members:[ [Object],[Object] ], inheritance:null, extAttrs:[] }

  this.fix_names(theInterface);
  record_name(theInterface.name, "interface");

  // zephyr's idl contains operations with no preceding type, which is
  // incorrect WebIDL -- should we complain and exit, or convert the
  // operation to returning a void (plus tell the user that's what we did)?
  // The pattern when the parser hits this error is to put the operation's
  // name in the idlType->idlType field, so that's where we look for it.
    // TODO: this doesn't work for "Promise", as that adds an extra layer
    // of .ildType -- so we should come up with some kind of function to
    // walk the idlType fields until we hit something we can latch onto...
  for (var i = 0 ; i < theInterface.members.length; i++)
  {
      let operation = theInterface.members[i];
      if (operation.name == null)
      {
	  if (operation.idlType !== undefined &&
	      typeof operation.idlType.idlType === 'string' &&
	      operation.idlType.idlType.length >= 1)
	  {
	      if (fix_type_errors)
	      {
		  /* no rhyme or reason, here: we're just working off of
		     what the parser does... */
		  operation.name = operation.idlType.idlType;
		  operation.idlType.idlType = 'void';
		  console.log("\t>" + operation.name + "< in >" + theInterface.name + "< had no return type; defaulting to void.");
	      }
	      else
		  throw new Error("No return type given for operation >" + operation.idlType.idlType + "< in interface >" + theInterface.name + "<.");
	  }
	  else
	      throw new Error("Operation return type is unspecified.");
      }
  }

  /* look through the external attributes and see if any are specifying
     references to types defined in other places */
  this.set_external_types(theInterface);
  this.set_is_module(theInterface);

  /* does the interface already exist? (if we've already processed an
     interface with this name, it'll have the interfaceName field set) */
  var interface_exists = (theInterface.interfaceName != undefined);

  if (interface_exists) {
    this.addToExistingInterface(theInterface, index);
  } else {
    // doesn't exist. Add it as a new key.
    this.addNewInterface(theInterface);
  }

  // augment the interface by adding operation fields.
  // ????????????

  // get a list of types that will need to be included in the .c file for this
  // interface
  this.get_non_intrinsic_types_list(theInterface);

  return true;
}; /* addInterface */


/* the parser doesn't care if mullitple WebIDL constructs (or fields
 * within a construct) share the same name, but we do; check to make
 * sure that the namespace is correct, and report and raise en
 * exception if something's amiss */
AugmentedAST.prototype.report_reused_names = function()
{
    /* if we encounter any errors, we'll save them here, so that we
       can give the user a full list of errors (instead of making them
       fix/compile/fix/etc...) */
    var error_messages = [];

    /* returns an array of names that are used more than once in a function
       call */
    /* "_named_list", because the list passed in has to be an array of
       objects and each object must have a name-type field as defined
       by the "accessor" parameter (which defaults to "name")... */
    var find_duplicates_in_named_list = function(named_list, accessor)
    {
	if (accessor === undefined)
	    accessor = "name";

	var names_seen = {};
	var duplicates = [];

	for(var name_iterator = 0;
	    name_iterator < named_list.length;
	    name_iterator++)
	{
	    var name = named_list[name_iterator][accessor];

	    if (names_seen[name]) names_seen[name]++;
	    else                  names_seen[name] = 1;
	}

	for(var name of Object.keys(names_seen))
	{
	    var occurences = names_seen[name];
	    if (occurences > 1)
		duplicates.push({"name":          name,
				 "occurences":    occurences});
	}
	return duplicates;
    } /* find_duplicates_in_named_list */

    /* the code to handle duplicate dictionary fields, callback arguments,
       and operation arguments is almost exactly the same... */
    /* "extra_bit" is only used when we're processing interfaces */
    /* SIDE EFFECT: populates the (function-level) global array
       error_messages */
    var report_duplicates = function(duplicates,
				     type_of_thing,
				     name_of_thing,
				     extra_bit
				    )
    {
	if (duplicates.length === 0) return;

	for(var i=0; i < duplicates.length; i++)
	{
	    var name = duplicates[i].name;
	    var occurences = duplicates[i].occurences;

	    error_messages.push("The name \"" + name +
				"\" is used " + occurences + " times in the " +
				type_of_thing + " named \"" + name_of_thing +
				"\"" + extra_bit +".");
	}
    }; /* report_duplicates */


    /* dictionaries: */
    /* we need to make sure dictionary fields are uniquely named */
    for (var dictionary_name in this.dictionaries)
    {
	var duplicates = find_duplicates_in_named_list(
	                           this.dictionaries[dictionary_name].members);
	report_duplicates(duplicates, "dictionary", dictionary_name, "");
    }

    /* callbacks: */
    /* we need to make sure callback arguments are uniquely named */
    for (var callback_name in this.callbacks)
    {
	var callback = this.callbacks[callback_name];
	var duplicates = find_duplicates_in_named_list(callback.arguments);
	report_duplicates(duplicates, "callback", callback_name, "");
    }

    /* interfaces: */
    /* we need to make sure operations and attributes are uniquely named,
       and for each operation, that its arguments are uniquely named, relative
       to the other arguments in that operation */
    for (var interface_name in this.interfaces)
    {
	var interface_ = this.interfaces[interface_name];

	/* first, check all of the fields of the interface */
	var attribute_names = interface_.attributes.map(
	                               x=>{return {"name": x.attributeName}});
	var operation_names = interface_.operations.map(
	                               x=>{return {"name": x.operationName}});
	var all_interface_names = attribute_names.concat(operation_names);
	var interface_duplicates = 
	                   find_duplicates_in_named_list(all_interface_names);
	report_duplicates(interface_duplicates, "interface", interface_name,"");

	/* next, check all of the operations' argument lists */
	for (var i = 0; i < interface_.operations.length; i++)
	{
	    var operation = interface_.operations[i];
	    var operation_name = operation.operationName;
	    var duplicates = find_duplicates_in_named_list(operation.arguments);
	    report_duplicates(duplicates, "operation", operation_name, " in the interface named \"" + interface_name + "\"");
	}
    }

    /* finally, check for duplicate names in the WebIDL constructs */
    for (var construct_name in names_seen)
    {
	var construct_name_object = names_seen[construct_name];
	var used_in_callbacks = construct_name_object.callback;
	var used_in_dictionaries = construct_name_object.dictionary;
	var used_in_interfaces = construct_name_object.interface;

	if (used_in_callbacks + used_in_dictionaries + used_in_interfaces > 1)
	{
	    /* to get all of the plurals and commas correct, we'll divide
	       the error message up as follows:
	       line 1:       "The name "<name>" is duplicated in
	       line 2:        <number > 0> callback<s>
	       line 3:        <,>< ><and >
	       line 4:        <number > 0> dictionar<y/ies>
	       line 5:        <,>< >< and>
	       line 6:        <number > 0> interface<s>
	       line 7:        ."
	    */
	    var line1 = "The name \"" + construct_name + "\" is duplcated in ";

	    var line2;
	    if (used_in_callbacks > 0)
	    {
		var plural = (used_in_callbacks > 1)?"s":"";
		line2 = used_in_callbacks+" callback" + plural;
	    }
	    else
		line2 = "";

	    var line3;
	    if (used_in_callbacks > 0)
	    {
		var comma = (used_in_dictionaries && used_in_interfaces)?",":"";
		var space = (used_in_dictionaries || used_in_interfaces)?" ":"";
		var num_xor = function(x, y) {return (x === 0) && (y != 0) ||
					      (y === 0) && (x != 0);  };
		var conjunction = (num_xor(used_in_dictionaries,
					   used_in_interfaces)  )?"and ":"";
		line3 = comma + space + conjunction;
	    }
	    else
		line3 = "";

	    var line4;
	    if (used_in_dictionaries > 0)
	    {
		var plural = (used_in_dictionaries > 1)?"ies":"y";
		line4 = used_in_dictionaries + " dictionar" + plural;
	    }
	    else
		line4 = "";

	    var line5;
	    if (used_in_dictionaries > 0)
	    {
		if (used_in_callbacks && used_in_interfaces)
		    /* all three are nonzero */
		    line5 = ", and ";
		else if (used_in_interfaces)
		    /* only two are nonzero */
		    line5 = " and ";
		else 
		    line5 = "";
	    }
	    else
		line5 = "";

	    var line6;
	    if (used_in_interfaces > 0)
	    {
		var plural = (used_in_interfaces > 1)?"s":"";
		line6 = used_in_interfaces + " interface" + plural;
	    }
	    else
		line6 = "";

	    var line7 = ".";

	    error_messages.push(line1 + line2 + line3 + line4 +
				line5 + line6 + line7);
	}
    }

    if (error_messages.length > 0)
	throw {"message": error_codes.duplicate_names,
	       "messages": error_messages};
} /* AugmentedAST.report_reused_names */

/**
 * checks each type in the queue of types to check
 * @returns {boolean}
 */
AugmentedAST.prototype.processTypeCheckQueue = function ()
{
    if (0)
    while (this.typeCheckQueue.length !== 0)
    {
	if (!this.checkType(this.typeCheckQueue.pop()))
	    throw "Type error";
    }
    else
	for(let i = 0; i < this.typeCheckQueue.length; i++)
	if (!this.checkType(this.typeCheckQueue[i]))
	    throw "Type error";

    return true;
}; /* processTypeCheckQueue */


/**
 * any type can have a field, parameter, etc. that is another type -- when
 * we put out the C code, we need to ensure that we put out one type before
 * it's used in another type, so we need to sort all of the types into the
 * correct order for outputting.
 * walks all of the types and sets the ".sorted_types" list so that we put
 * put them out in the right order
 */
/* SIDE EFFECT: sets this.sorted_types_list */
/* TODO: THIS WAS DEPRECATED AFTER MOVING TO SEPARATE COMPILATION;
 * REMOVE AND TEST THAT EVERYTHING WORKS... */
var topological_sort = require('topsort'); var _ = require('lodash');
AugmentedAST.prototype.sort_types = function()
{
    this.sorted_types_list = [];
    return;
    /* first, build a list of all type names */
    let names = Object.keys(this.dictionaries).concat(
	        Object.keys(this.callbacks).concat(
	        Object.keys(this.enums).concat(
		Object.keys(this.interfaces))));

    /* so we have a way to map names to entries; now, walk the types again
       and build the edges to be sorted */
    let edges = [];

    /* this is our function used for mapping each of the objects' field types
       to other objects and adding an edge to our list for sorting */
    /* the design is a closure of a closure -- the first one is b/c it's
       so hard to ensure that we store the "this" pointer (and the
       two callback functions don't change for any of the three types
       (interfaces, dictionaries, and callbacks)) */
    let add_edge = (function(primitiveType, getTypeName)
                    {
			let primitive_type = primitiveType;
			let get_type_name = getTypeName;

			return function(user)
			{
			    let user_of_type = user;
			    let is_array =
				function(member)
			        {
				    return (member.idlType &&
					    member.idlType.array > 0);
			        }; /* is_array */

			    return function(member)
			    {
				if (primitive_type(member) &&
				    !is_array(member))
				    return; 
				let member_type = get_type_name(member);
				if (primitive_type(member) && is_array(member))
				    member_type += "_Array";
				let member_index = names.indexOf(member_type); 
				/* an edge, [a,b], should be read "a must
				   come before b" */
				return [ member_index, user ];
			    }; /* returned function (closure) */
			}; /* return function (closure) */
		   }) (this.isPrimitiveType.bind(this),
		       this.getCTypeName.bind(this)); /* add_edge */
    let remove_undefines = function(x) {if (x == undefined || (x[0] == -1 ||
							       x[1] == -1))
					   return false;
				        else
					   return true;}; /* remove_undefines */
    for (let next in this.dictionaries)
    {
	let dictionary = this.dictionaries[next];
	let this_index = names.indexOf(dictionary.name);

	edges = edges.concat(dictionary.members.map(add_edge(this_index)).filter(remove_undefines));
    }
    for (let next in this.callbacks)
    {
	let callback = this.callbacks[next];
	let this_index = names.indexOf(callback.callbackName);

	edges = edges.concat(callback.arguments.map(add_edge(this_index)).filter(remove_undefines));
    }
    for (let next in this.interfaces)
    {
	var next_interface = this.interfaces[next];
	let this_index = names.indexOf(next_interface.interfaceName);

	/* operations' arguments list */
	for (let operation of next_interface.operations)
	    edges = edges.concat(operation.arguments.map(add_edge(this_index)).filter(remove_undefines));
	/* attributes */
	edges = edges.concat(next_interface.attributes.map(add_edge(this_index)).filter(remove_undefines));	    
    }

    /* sort the edges */
    let sorted_types = topological_sort(edges);

    /* turn the sorted list of numbers into their corresponding names */
    let sorted_names = sorted_types.map( x => {return names[x];} );

    /* not every name is in the sorted list (e.g., a dictionary that only
       uses builtin types won't have any edges to other dictionaries), so
       make sure we don't ignore those */
    let diff = _.difference(names, sorted_names);

    /* finally, construct a list of the actual objects for Hogan to
       iterate through */
    let all_names_sorted = diff.concat(sorted_names);

    this.sorted_types_list = all_names_sorted.map(x => {
	     if (this.dictionaries[x] != undefined) return this.dictionaries[x];
	     if (this.callbacks[x] != undefined) return this.callbacks[x];
	     if (this.interfaces[x] != undefined) return this.interfaces[x];
	     if (this.enums[x] != undefined) return this.enums[x];
    });
}; /* sort_types */
 
/**
 * marks every type that is a callback with a flag, b/c "interpreter_get_*"
 * needs an extra "this" parameter when used for callbacks
 */
AugmentedAST.prototype.find_and_mark_callbacks = function()
{
    for (var next_interface in this.interfaces)
    {
	let operations_array = this.interfaces[next_interface].operations;
	let operations_length = operations_array.length;
	for (let i = 0; i<operations_length; i++)
	{
	    let operation = operations_array[i];
	    let arguments_array = operation.arguments;
	    let arguments_length = arguments_array.length;

	    for (let j = 0; j<arguments_length; j++)
	    {
		let argument = arguments_array[j];
		let argument_type = argument.C_and_Jerryscript_Types;

		/* even though we set the .callback field when we
		   process the arguments, we might not have seen the
		   declaration of the callback at that point, so we need
		   to check again at this point (after the entire AST has
		   been read in and processed) */
		if (this.isCallbackType(argument_type.C_Type))
		{
		    argument_type.callback = true;
		    argument_type.callback_return_type = this.callbacks[this.getTypeName(argument_type.C_Type)].return_type;
		}

		if (argument_type.callback)
		{
		    operation.has_callback_parameters = true;
		}
	    }
	}
    }
} /* AugmentedAST.find_and_mark_callbacks */


/** walks through every interface's attributes and marks those that
  * have type interface, b/c if interface A has an attribute that is
  * interface B, when we call A's constructor, we'll also want to call
  * B's constructor, so mark all of the attributes of each interface
  * with whether or not they are interfaces
  */
AugmentedAST.prototype.find_interface_attributes = function()
{
    for (var i in this.interfaces)
    {
	let attribute_array = this.interfaces[i].attributes;
	for (var j = 0; j < attribute_array.length; j++)
	{
	    let C_Type = attribute_array[j].C_and_Jerryscript_Types.C_Type;
	    if (this.interface_names.indexOf(C_Type) >= 0)
		attribute_array[j].C_and_Jerryscript_Types.is_interface = true;
	}
    }
} /* AugmentedAST.find_interface_attributes */


/** we need to walk up the inheritance chain, adding each parent's
  * attributes and operations to the each interface's list, and
  * this is an inherently recursive procedure (if A inherits from B,
  * which inherits from C, we first need to add C's interfaces and
  * operations to B before adding B's fields to A); NOTE: this assumes
  * that all parents are defined in this file -- if we ever relax that
  * requirement, this function won't be able to define the whole chain
  */
AugmentedAST.prototype.find_inheritance_chain = function(interfaces_list)
{
    let already_seen = [];

    /* copies the attributes and operations from the interface named
       "parent_name" to "target" -- this function recurs if "parent_name"
       inherits from another interface so that "parent_name" gets filled
       in before trying to copy it to "target"; the recursion stops when
       an interface has an empty "inheritance" field */
    let transfer_interface = function(parent_name, target)
    {
	var number_of_parent_fields_copied = 0;

	already_seen.push(target.interfaceName);

	if (parent_name != null)
	{
	    var parent = interfaces_list[parent_name];

	    if (parent === undefined)
	    {
		/* an obvious error is to try to use an external type
		   as one's parent, but we have no way to support this */
		if (target.externalTypes.map(x => x.type).indexOf(parent_name) >= 0)
		    throw {"message"    : error_codes.external_inheritance,
			   "object_name": target.interfaceName,
			   "parent_name": parent_name };
		else
		    throw "Can't find a definition of \"" + parent_name + "\" to use in defining \"" + target.interfaceName + "\".";
	    }

	    /* fully define parent before copying it to target */
	    if (already_seen.indexOf(parent_name) <0)
		transfer_interface(parent.inheritance, parent);

	    /* make sure that we have valid places to put "parent"'s fields */
	    if (target.operations === undefined)
		target.operations = [];
	    if (target.attributes === undefined)
		target.attributes = [];

	    /* we walk backwards through the parent's attributes array and
	       stick each one onto the front of the target's attributes array;
	       this keeps them in the original order but preceding target's
	       own list (we don't bother to do this for interfaces, since
	       their order doesn't matter) */
	    let existing_attributes = target.attributes.map(
		                                         a => a.attributeName);
	    for(var i = parent.attributes.length-1; i >= 0; i--)
	    {
		var attribute = parent.attributes[i];
		if (existing_attributes.indexOf(attribute.attributeName) < 0)
		{
		    target.attributes.unshift(attribute);
		    number_of_parent_fields_copied++;

		    /* Note that we don't need to add attributeName
		       to the existing_attributes list, as parent can't
		       have multiple attributes with the same name */
		}
	    }

	    /* ...operations need to be marked so that we call
	       the right handler, so (maybe) instead of just copying the
	       pointer to the operation object, we need to clone it and
	       set up the markers */
	    let operation_names = target.operations.map(a => a.operationName);
	    for (var operation of parent.operations)
	    {
		/* if we already have an operation with this name,
		 * then don't add it to target */
		if (operation_names.indexOf(operation.operationName) < 0)
		{
		    /* Note that we don't need to add operation.operationName
		       to the operation_names list, as parent can't
		       have multiple operations with the same name */

		    /* (if the operation.type is already "inherited_operation",
		       then the operation object is set up correctly
		       for target) */
		    if (operation.type === "inherited_operation")
			target.operations.push(operation);

		    else /* otherwise, make a copy and add it to target */
		    {
			var new_operation = Object.assign({}, operation);

			new_operation.type = "inherited_operation";
			new_operation.inherited_operation = true;
			new_operation.parent = parent_name;
			/* for some reason, operations have a field
			   called "interfaceName", which conflicts
			   with the enclosing interface's (which also
			   has a field by that name) -- so remove this
			   one so the Hogan compiler gets the right one */
			new_operation.defining_interface =
			                           new_operation.interfaceName;
			delete new_operation.interfaceName;
			
			target.operations.push(new_operation);
		    }
		    number_of_parent_fields_copied++;
		}
	    }
	}
	/* if we include parent's .h file, we'll trivially get all
	   of the #include's necessary to include all of the types
	   that parent uses (and that we now use, since we're
	   copying all of parent's files), so add parent to the
	   list of "non_intrinsic_types" */
	/* but only add the include if we actually copied even a single
	   field from the parent */
	if (number_of_parent_fields_copied > 0)
	    if (target.non_intrinsic_types.filter(x=>x.type_name === parent_name).length === 0)
		target.non_intrinsic_types.push({type_name: parent_name});
	else
	    /* TODO: if no parent fields are copied, is this an error? */
	    ;

    } /* transfer_interface */

    /* we're going to assume that the attributes should be in the order of
       earliest parent first */
    for (var i in interfaces_list)
    {
	if (already_seen.indexOf(i) < 0)
	{
	    var parent_name = interfaces_list[i].inheritance;

	    transfer_interface(parent_name, interfaces_list[i]);
	}
    }
} /* AugmentedAST.find_inheritance_chain */


/* while we're processing the code, we build up a list of composite
   types in the form of a list of the WebIDL types in each composite
   -- now, we have to do post-processing on the list to: 1) convert
   the list of WebIDL types to a list of C_and_Jerryscript_Types
   structs so we can later build up the code to implement them; 2) get
   the list of non-intrinsic types in the composite, since those will
   need to be #include'd in the C file that builds the composite type */
AugmentedAST.prototype.build_composite_types = function(composites)
{
    /* the composite comes in with a single value for the "default_value"
       field -- this is the WebIDL type of the first type in the composite,
       and we need to overwrite the "default_value" field with an object
       composed of the WebIDL type and the C_and_Jerryscript_Types value
       for that WebIDL type */
    /* note that we also set up an empty externalTypes field, as all of the
       functions that work on the other types expect this to exist */
    var set_up_default_values = function(composite)
    {
	composite.externalTypes = new Array();

	composite.default_value = {
	       "default_name": composite.default_value,
	       "C_and_Jerryscript_Types":
			      this.getConversionTypes(composite.default_value)};
    }; /* set_up_default_values */

    var build_type_list_from_webidl_list = function(composite)
    {
	var webidl_type_list = composite["webidl_type_list"];
	var getConversionTypes = this.getConversionTypes;

	let new_c_and_j_type_list = [];
	for (let i = 0 ; i < webidl_type_list.length; i++)
	    new_c_and_j_type_list.push(
		                this.getConversionTypes(webidl_type_list[i]));
	composite["c_and_j_type_list"] = new_c_and_j_type_list;

	/* we'll need to name each field by its webidl name, so record that
	   in each type's entry */
	for (var i =0; i < composite["c_and_j_type_list"].length; i++)
	    composite["c_and_j_type_list"][i].webidl_name =
		webidl_type_list[i].replace(/ /g,''); /* remove whitespace */
	
	/* this is for Mustache output: */
	composite["c_and_j_type_list"][0].first_in_list = true;
    }; /* build_type_list_from_webidl_list */

    /* because Javascript only has a single numeric type, we want to convert
       Javascript values into the largest C type so as to keep from losing
       bits; this routine will build a subset of the c_and_j_type_list with
       only a single (the largest) numeric (C) type and then store this
       filtered list in j_to_c_type_list in the composite */
    let filter_numeric_types = function(composite)
    {
	var filtered_list = [];
	/* we'll arbitrarily define unsigned's to be bigger than signed's,
	   and floating-point trumps any integral value */
	var c_type_size = { int8_t:    7 ,
			    uint8_t:  8 ,
			    int16_t:  15,
			    uint16_t: 16,
			    int32_t:  31,
			    uint32_t: 32,
			    long:     32,
			    int64_t:  63,
			    longlong: 63,
			    uint64_t: 64,
			    float:    65,
			    double:   66,
			  };
	var greater_than = function(x, y)
	{
	    if      (typeof x == "undefined") return y;
	    else if (typeof y == "undefined") return x;

	    return (c_type_size[x.C_Type] > c_type_size[y.C_Type]);
	}; /* greater_than */

	var largest_numeric_type;
	var c_and_j_type_list = composite.c_and_j_type_list;
	for(var i = 0; i < c_and_j_type_list.length; i++)
	{
	    var this_type = Object.assign({}, c_and_j_type_list[i]);

	    /* if the C_Type field isn't numeric, just put it onto the new
	       list */
	    if (typeof c_type_size[this_type.C_Type] == "undefined")
		filtered_list.push(this_type);
	    else if (greater_than(this_type, largest_numeric_type))
		largest_numeric_type = this_type;
	}

	/* stick the largest numeric type we found onto the end of the list */
	if (typeof largest_numeric_type != "undefined")
	    filtered_list.push(largest_numeric_type);

	filtered_list[0].first_in_list = true;
	composite.j_to_c_type_list = filtered_list;
    }; /* filter_numeric_types */

    Object.values(this.composites).forEach(
					build_type_list_from_webidl_list,
					this /* stay in the current context */);

    Object.values(this.composites).forEach(
					set_up_default_values,
					this /* stay in the current context */);

    Object.values(this.composites).forEach(
	                                this.get_non_intrinsic_types_list,
					this /* stay in the current context */);

    Object.values(this.composites).forEach(
	                                filter_numeric_types,
	                                this /* stay in the current context */);
} /* build_composite_types */


/* as a user-interface hack, we're going to document that the
   External* attributes have to be added to every WebIDL construct
   that uses them, but as a practical matter, we'll walk the
   non_intrinsic_types lists of each object, and if a type is listed
   in the global allExternalTypes list, we'll move it from the
   current object's non_intrinsic_types list to its externalTypes
   list */
/* (if we decide not to help the user out this way, just raise an
   exception instead of doing the list updates...) */
/* this works the other way, too (indeed, it's a matter of
   correctness) -- if a type has been declared external but the user
   happened to include it in this compilation, we need to move the
   entry from the externalTypes list to the non_intrinsic_types
   list (b/c external types (which are compiled into a different
   directory) have a different #include syntax than non-intrinsic-types
   (which we compile into the current directory)) */
AugmentedAST.prototype.find_and_recategorize_external_types = function()
{
    /* ...we've stored all of the external types we've seen, but some
       of the types in this list may actually be included in the
       current compilation, so first grab all of the external types
       and then cull the list by what's defined in the current
       file... */
    var defined_in_this_file = Object.keys(this.callbacks).concat(
	                       Object.keys(this.dictionaries),
	                       Object.keys(this.interfaces));
    var all_external_types =
	    Object.keys(this.allExternalTypes).filter(
		                  val => !defined_in_this_file.includes(val));
    
    /* we'll do the same thing for all three constructs, so we've
       abstracted out the functionality here -- this function walks a
       list of non-intrinsic types and returns a list of strings
       corresponding to types that should be deleted from the object's
       non_intrinsic_types list and added to its externalTypes list */
    var find_list_modifications = function(non_intrinsic_types)
    {
	var modifications_list = [];

	for (var index=0; index < non_intrinsic_types.length; index++)
	{
	    var type_name = non_intrinsic_types[index].type_name;

	    if (all_external_types.indexOf(type_name) >= 0)
		modifications_list.push(type_name);
	}
	return modifications_list;
    } /* find_list_modifications */

    var fix_non_intrinsics_lists = function(things_list, all_external_types)
    {
	/* walk each object's non_intrinsic_types list, and move any
	   type that shows up in "all_external_types" to the object's
	   external_types list */
	/* ("things_list" is really an object, not a list...) */
	for(var thing_name in things_list)
	{
	    var thing = things_list[thing_name];
	    var non_intrinsic_types = thing.non_intrinsic_types;
	    var list_modifications = find_list_modifications(non_intrinsic_types);
	    for(var modification_index = 0;
		    modification_index < list_modifications.length;
		    modification_index++)
	    {
		var type_name = list_modifications[modification_index];
		thing.externalTypes.push(all_external_types[type_name]);
		
		var delete_index = non_intrinsic_types.map(x=>x.type_name).indexOf(type_name);
		non_intrinsic_types.splice(delete_index, 1);
	    }
	}
    }; /* fix_non_intrinsics_lists */

    var fix_externalTypes_lists = function(things_list, all_external_types)
    {
	/* ("things_list" is really an object, not a list...) */
	for(var thing_name in things_list)
	{
	    var thing = things_list[thing_name];

	    var external_types_to_keep = [];
	    for(var i = 0; i < thing.externalTypes.length; i++)
	    {
		var next_type = thing.externalTypes[i];
		
		if (all_external_types.indexOf(next_type.type) < 0)
		    thing.non_intrinsic_types.push({"type_name": next_type.type});
		else
		    external_types_to_keep.push(next_type);
	    }
	    thing.externalTypes = external_types_to_keep;
	}
    }; /* fix_externalTypes_lists */


    /* TODO: should the 2nd parameter be the locally defined
       all_external_types? */
    fix_non_intrinsics_lists(this.callbacks, this.allExternalTypes);
    fix_non_intrinsics_lists(this.dictionaries, this.allExternalTypes);
    fix_non_intrinsics_lists(this.interfaces, this.allExternalTypes);

    /* note that we could have checked before moving a type from the
       non_intrinsic_types list to the externalTypes list (in the loop
       inside fix_non_intrinsics_list), but that wouldn't have
       obviated the need for this loop */
    fix_externalTypes_lists(this.callbacks, all_external_types);
    fix_externalTypes_lists(this.dictionaries, all_external_types);
    fix_externalTypes_lists(this.interfaces, all_external_types);
    
} /* AugmentedAST.find_and_recategorize_external_types */


/**
 * Iterates over the ast and augments it by calling other methods in this class.
 * @param [ast]
 * @returns {AugmentedAST}
 */
AugmentedAST.prototype.augment = function (ast) {
  // passing in an ast sets this.ast and starts augmenting
  if (ast) {
    this.ast = ast;
    this.isAugmented = false;
  }

  if (this.isAugmented) {
    return this; //already augmented
  }

    /* record typedefs in their own structure (this.typedefs) -- we could(!)
       remove them from the ast, but right now, we just ignore them in the
       next loop... */
    this.record_typedefs(this.ast);

  var t = this.ast;
  // note, we visit everything in the TOP level only.
  // this limits the nodes that are supported.
  // the nodes inside are checked in their corresponding methods.
  for (var i = 0; i < t.length; i++) {
    var type = t[i].type;
    if (type === 'interface') {
	this.addInterface(t[i], i, this.fix_type_errors);
    } else if (type === 'dictionary') {
	this.addDictionary(t[i], i);
    } else if (type === 'exception') { //3.4
      // TODO Support exceptions
    } else if (type === 'enum') {
	this.addEnum(t[i], i);
    } else if (type === 'callback') {
	this.addCallback(t[i], i);
    } else if (type === 'typedef') { //3.7
      // TODO Support typedefs
    } else if (type === 'implements') { //3.8
      // TODO Support implements
    } else {
      throw "Type not supported at top level: " + t;
    }
  }

    this.report_reused_names();

  // squash the ast
  var offset = 0;
  for (var iindex = 0; iindex < this.removedIndices.length; iindex++) {
    this.ast.splice(this.removedIndices[iindex] - offset, 1);
    offset++;
  }
  this.removedIndices = [];


    // while walking the ast, we built up a list of all of the type names
    // that we saw; now, we'll walk the list to make sure they're all valid
    this.processTypeCheckQueue();

    /* every time we put out a type into the .h file, we need to also put
       out the "<type>_Array" type if anything in the file needs an array
       of those things; so this list holds the list of types that will
       require an associated "_Array" type and associated extractor/creator
       functions */

    /* TODO: variadic types*/
    /* variadic types are themselves arrays, although they require slightly
       different extractor functions -- we'll build up the list of variadic
       types, during execution of this function... */
  /*this.array_types = this.get_the_list_of_array_types(this.variadic_types); */

    /* ...we'll take the arrays list and create dictionary entries for
       them -- array types are almost exactly like dictionaries, so
       we'll just have a little special-case code in the
       dictionary-handling code */
    this.convert_list_of_array_types_to_dictionaries(this.array_types);

    /* TODO: fix enumeration values if they overlap (b/c this won't
       translate into C correctly) */

    /* types need to be put out in the correct order -- e.g., if type A
       has a field of type B, we need to make sure that B gets outputted
       in the .h file before A */
    /* this function builds a list of types called sorted_types_list */
/*    this.sort_types();*/

    /* annotate all variables that are callbacks */
    this.find_and_mark_callbacks();

    /* if interface A has an attribute that is interface B, when we
       call A's constructor, we'll also want to call B's constructor,
       so mark all of the attributes of each interface with whether or
       not they are interfaces */
    this.find_interface_attributes();

    /* likewise, if interface A inherits from interface B, we want to
     * overlay B's prototype onto A's; so create the list that Hogan
     * will use */
    this.find_inheritance_chain(this.interfaces);

     /* at this point, we have a list of composite types, but we still
	need to build the C_and_Jerryscript_Types structures for the
	individual elements of the composite type... */
    this.build_composite_types();

    this.find_and_recategorize_external_types(this.interfaces);

  this.isAugmented = true;
  this.ast.augmenter = this; // we keep the info we collected in the process.

  return this;
};/* AugmentedAST.augment */


// static methods

/**
 * Returns the string type name of a object.
 * Note, if it doesn't matter if it's an array or an operation etc. It returns the most concrete type.
 * E.g. if it's an array of longs, returns long. If it's an operation, returns the operation's return type, etc.
 * @type {Function}
 */
AugmentedAST.getTypeName = AugmentedAST.prototype.getTypeName = function (obj) {
  if (typeof obj == 'string') {
    return obj;
  }

  if (obj.idlType != undefined) {
    return AugmentedAST.prototype.getTypeName(obj.idlType);
  }

  if (obj.type != undefined) {
    return AugmentedAST.prototype.getTypeName(obj.type);
  }

  // base case
  return undefined;
}; /* AugmentedAST.getTypeName */

AugmentedAST.prototype.getCTypeName = function (obj)
{
    return this.getConversionTypes(obj).C_Type;
} /* getCTypeName */


/* this maps the idlType through the type_mapper and returns a string of
   the mapped type -- the type_mapper's "didn't find it" return value should
   be "undefined"; this function serves as
   a wrapper for the recursive helper function, below -- we need to be able
   to handle composite types and then build all of the code that those
   types will need, so we need a wrapper to notice when we've found
   a composite and to do the extra work... */
/* SIDE EFFECT: sets the "name", "composite", and "array" fields in idlType */
AugmentedAST.prototype.idlTypeToOtherType = function(idlType,
						     type_mapper,
						     is_variadic = false)
{
    var self = this;
    /* the whole purpose of this wrapping function is to grab the
       new type and make sure it doesn't require further processing; in
       this case, if the type comes back with an array instead of a
       string, that's a composite type, and we'll have to convert it
       into a single string */
    var new_type = this.idlTypeToOtherType_helper(idlType, type_mapper);

    /* like composite types (below), when we see an array, we need to
       create a new name for it and enter it onto a list of array types
       that will need to be instantiated in C code later; this function
       is recursive, since it's possible to have arrays-of-arrays-of... */
    /* the "array_thing" parameter should be a struct with two fields:
       "items" (either a string (and we're done) or another of this
       type (and we have to recur)) and "array", which is a boolean
       (and ignored) */
    var create_array_type = function(array_thing, list_of_array_types)
    {
	var element_typename;
	var return_typename;

	/* base case */
	if (typeof array_thing.items === "string")
	    element_typename = array_thing.items;
	/* recursive case */
	else
	    element_typename = create_array_type(array_thing.items,
					         list_of_array_types)+"_array";

	return_typename = element_typename+"_array";
	let needs_include = !self.isPrimitiveType(element_typename);
	list_of_array_types[return_typename] = {"typeName":   return_typename,
						"elementType":element_typename,
					        "needs_include": needs_include};
	return return_typename;
    } /* create_array_type */

    /* when we see a composite type, we have to do two things: first,
       build the composite-type's name (which will be a conglomeration
       of the type names that make it up) and, second, save off the
       list so that we can build C_and_Jerryscript_Types for each of
       the members of the type */
    /* SIDE EFFECT: adds the new type to the "this.composites" list for
       later processing */
    var create_composite_type =
	function(list_of_webidl_types, composites)
        {
	    /* first, remove duplicates (since it's useless to have multiple
	       fields of a union be the same type) and then alphabetize the
	       list (to be able to construct a canonical name)  */
	    /* (duplicate-removal is done by first loading all of the
	       elements into a set (which naturally removes
	       duplicates) and then using the ellipsis operator to
	       turn the set back into an array) */
	    list_of_webidl_types =
	                       [...new Set([].concat(...list_of_webidl_types))];
	    list_of_webidl_types = list_of_webidl_types.sort();

	    /* next, build a string from the names of the types
	       (first, substitute the name of the array for any
	        structs in the list) */
	    var list_of_type_names = [];
	    var get_array_name = function(x) 
	                         {
				     if (typeof x == "string") 
					 return x;
				     else
				     {
					 if (x.type != "array" ||
					     typeof x.items == "undefined")
					     throw "error in creating composite-type's name";
					 return create_array_type(x, self.array_types);
				     }};
	    var add_array_name = function (x) { list_of_type_names.push(get_array_name(x));};
	    list_of_webidl_types.forEach(add_array_name, this);
	    list_of_type_names = list_of_type_names.sort()
	    var new_name = list_of_type_names.join("_or_");
	    new_name = new_name.replace(/ /g,""); /* regex removes spaces from
						   types like "unsigned long" */

	    /* finally, add this type onto the list of "composites" (if
	       it isn't already on the list) so that we can output all of
	       the required code at the backend */
	    /* for the constructor for this type, we (arbitrarily)
	       want to put out the first field type as the default
	       value, but since Mustache doesn't have a way to access
	       only the first element in the list, we'll just store
	       that first thing as a separate value and just use that
	       one when we need to put out the constructor */
	    if (composites[new_name] === undefined)
	    {
		var new_entry = {"type": "composite",
				 "compositeName" : new_name, 
				 "webidl_type_list2": list_of_webidl_types,
				 "webidl_type_list": list_of_type_names,
				 "default_value": list_of_webidl_types[0] };
		composites[new_name] = new_entry;
	    }

	    return new_name;
	}; /* create_composite_type */
    
    /* record default values that then get updated as necessary: */
    idlType.array = false;
    idlType.composite = false;

    /* if we have an array of types, we'll need to create a new (union) type
       and return that name, instead */
    if (Array.isArray(new_type))
    {
	var list_of_webidl_types = new_type;

	new_type = create_composite_type(list_of_webidl_types,
					 this.composites);
	idlType.name = new_type;
	idlType.composite = true;
    }
    /* similarly, if we get back an object, it's an array type */
    else if (typeof new_type === "object")
    {
	if (new_type.type === "array")
	{
	    new_type = create_array_type(new_type, this.array_types);
	    idlType.name = new_type;
	    idlType.array = true;
	}
	else
	    throw new Error("Error in Sequence type.");
    }
    else
    {
	/* we need to store a string that is the idlType's name; the
	   easiest way to do this is to just call the helper again
	   with no type_mapper, as that will return this string */
	idlType.name = this.idlTypeToOtherType_helper(idlType, {});

	if (idlType.name === "ArrayBuffer")
	    create_array_type({"items": "byte"}, this.array_types);
    }

    /* as a last complication: now we know the type; if it's a variadic
       parameter, then it's an array of that type; we'll just copy the
       code, above, that handles an explicit array type */
    if (is_variadic)
    {
	/* create_array_type wants a particular data struture, so we'll
	   build one just to make it do what we want... */
	new_type = create_array_type({"items":new_type}, this.array_types);

	idlType.name = new_type;
	idlType.array = true;
    }

    return new_type;
} /* AugmentedAST.idlTypeToOtherType */


/* this maps the idlType through the type_mapper and returns a string of
   the mapped type -- the type_mapper's "didn't find it" return value should
   be "undefined" */
AugmentedAST.prototype.idlTypeToOtherType_helper = function(idlType, type_mapper)
{
    if (typeof idlType == 'string')
    {
	if (type_mapper != undefined)
	{
	    var this_type = type_mapper[idlType];
	
	    if (this_type === undefined)
		this_type = idlType;
	}
	else
	    this_type = idlType;

	return this_type;
    }
    
    if (typeof idlType == 'object')
    {
	var object_is_array = function(x) { return (typeof x.type != "undefined" &&
						x.type == "array"); }
	if (object_is_array(idlType))
	{
	    return sequenceItemType = this.idlTypeToOtherType(idlType.items, {})+"_array";
	}
	else if (idlType.sequence)
	{
	    if (idlType.idlType)
	    {
		var sequenceDepth = idlType.sequence;
		/* arrays will always be the WebIDL type... */
		var sequenceItemType = this.idlTypeToOtherType(idlType.idlType, {});
		return this.idlSequenceToSchema(sequenceDepth, sequenceItemType);
	    }
	    else
		throw new Error("Sequence type is empty.(?)");
	}
	else if (Array.isArray(idlType)) /* composite type; return a flattened
					    list of the webidl types -- notice
					    that when we recur, we send in an
					    empty type_mapper */
	{
	    var idlType_array = idlType;
	    var list_of_webidl_types = [];
	    for (var y = 0; y < idlType_array.length; y++)
		list_of_webidl_types =
		    list_of_webidl_types.concat(this.idlTypeToOtherType_helper(
							     idlType_array[y],
							     {}));
	    return list_of_webidl_types;
	}
	else if (idlType.idlType)
	{
	    /* recur */
	    return this.idlTypeToOtherType_helper(idlType.idlType, type_mapper);
	}
    }
   
    // if we haven't returned yet, there's a case we haven't handled...
    throw new Error("Couldn't handle idl type...");	
}; /* AugmentedAST.idlTypeToOtherType_helper */


/* this is a simple-minded version of idlTypeToOtherType, used just to get
   at the idlType's string */
AugmentedAST.prototype.get_idlType_string = function(idlType)
{
    if (idlType === undefined)
	console.log("NOT DEFINED"); /* TODO: probably raise an exception? */
    if (typeof idlType === "string")
	return idlType;
    else if (idlType.composite === true || idlType.array === true)
	return idlType.name;
    else if (idlType.idlType === undefined)
	throw new Error("Can't find idlType...");
    else
	return this.get_idlType_string(idlType.idlType);
} /* AugmentedAST.get_idlType_string */


AugmentedAST.prototype.idlSequenceToSchema = function(depth, itemType)
{
    //pre: itemType needs to be a schema...
    if(depth > 0)
    {
	return {
	    "type": "array",
	    "items": this.idlSequenceToSchema(depth-1, itemType)
	};
    }
    else
    {
	return itemType;
    }
}; /* AugmentedAST.idlSequenceToSchema */


AugmentedAST.prototype.getInterfaceArray = function(){
  var out = [];
  for(var key in this.interfaces){
    out.push(this.interfaces[key]);
  }

  return out;
}; /* AugmentedAST.getInterfaceArray */


AugmentedAST.prototype.getCompositeTypesArray = function()
{
    var array_of_types = [];
    for(var key in this.interfaces)
	array_of_types.push(this.composites[key]);

    return array_of_types;
} /* getCompositeTypesArray */


/* change the type of the externalTypes so that the Hogan compiler
   can iterate through it */
/* also, it's not an error to declare an ExternalType in the .idl file
   and then call the generator with both .idl files (i.e., the type is not
   really "external", b/c it is included at compile time -- in this case, we
   shouldn't put out include directives, b/c all of those types will be
   included */
AugmentedAST.prototype.getExternalTypesArray = function()
{
    var list_of_defined_types = Array().concat(Object.keys(this.dictionaries),
					       Object.keys(this.interfaces),
					       Object.keys(this.callbacks));

    var out = [];
    for(var key of Object.keys(this.allExternalTypes))
	if (list_of_defined_types.indexOf(key) == -1)
	    out.push(this.allExternalTypes[key]);
    return out;
} /* getExternalTypesArray */

/* change the type of the externalTypes so that the Hogan compiler
   can iterate through it */
/* also, it's not an error to declare an ExternalType in the .idl file
   and then call the generator with both .idl files (i.e., the type is not
   really "external", b/c it is included at compile time -- in this case, we
   shouldn't put out include directives, b/c all of those types will be
   included */
AugmentedAST.prototype.getExternalTypesArray = function()
{
    var list_of_defined_types = Array().concat(Object.keys(this.dictionaries),
					       Object.keys(this.interfaces),
					       Object.keys(this.callbacks));

    var out = [];
    for(var key of Object.keys(this.allExternalTypes))
	if (list_of_defined_types.indexOf(key) == -1)
	    out.push(this.allExternalTypes[key]);
    return out;
} /* getExternalTypesArray */


AugmentedAST.prototype.turn_object_into_array = function(x)
{
    var out = [];
    for(var key in x)
	out.push(x[key]);
    return out;
}; /* turn_object_into_array */

AugmentedAST.prototype.getDictionaryArray = function()
{
  var out = [];
  for(var key in this.dictionaries){
    out.push(this.dictionaries[key]);
  }
  return out;
};

AugmentedAST.prototype.getTypedefArray = function()
{
  var out = [];
  for(var key in this.typedefs){
    out.push(this.typedefs[key]);
  }
  return out;
}; /* getTypedefArray */

AugmentedAST.prototype.getEnumsArray = function(){
  var out = [];
  for(var key in this.enums){
    out.push(this.enums[key]);
  }
  return out;
}; /* getEnumsArray */

AugmentedAST.prototype.getCompositesArray = function(){
  var out = [];
  for(var key in this.composites){
    out.push(this.composites[key]);
  }
  return out;
}; /* getCompositesArray */

AugmentedAST.prototype.getCallbackArray = function(){
  var out = [];
  for(var key in this.callbacks){
    out.push(this.callbacks[key]);
  }
  return out;
}; /* getCallbackArray */

AugmentedAST.prototype.get_sorted_types_list = function(){
    return this.sorted_types_list;
}; /* get_sorted_types_list */

AugmentedAST.prototype.get_C_type_list = function(){
  if (this.C_type_list !== undefined)
      return this.C_type_list;
  else
      return undefined;
}; /* get_C_type_list */

/* dictionaries have the following fields:
   type: "dictionary"
   name: <string>
   partial: <bool>
   members: [ <objects> ]
   inheritance: <pointer> ??? -- always seems to be null
   extAttrs [ ] -- always seems to be empty

   ...but the only fields we use are: name and members

   ...from the "members" array: member objects have the following fields:
   type: <string>
   name: <string>
   required: <bool>
   idlType: <idlType>
   extAtrs: [ ] -- always seems to be empty
   C_and_Jerryscript_Types: created by getConversionTypes
   finalMember: <bool>

   ...and here, only name and C_and_Jerryscript_Types get used

   The entries in the list are structs that look like:
   {
       "elementType": <string> -- the type of the elements of the array
       "typeName": <string> -- the name of the array type
   }
*/
AugmentedAST.prototype.convert_list_of_array_types_to_dictionaries = function(array_types)
{
    /* TODO: UNIQ'IFY THE array_types LIST */

    for (let runner in array_types)
    {
	let next = array_types[runner];
	let array_type = next.typeName;
	let element_type = next.elementType;

	let members = [];

	members.push({"type": "field",
		      "memberName": "length",
		      "member_index": 0,
		      "required": true,
		      "idlType" : { "sequence": false,
				    "generic" : null,
				    "nullable" : false,
				    "union" : false,
				    "idlType" : "long",
				  },
		      "C_and_Jerryscript_Types":
		                  { "Jerryscript_Type": "number",
				    "C_Type": "uint32_t",
				    "is_array" : false,
				    "default_value": 0
				  }
		    });
	members.push({"type": "field",
		      "memberName": "items",
		      "member_index": 1,
		      "idlType" : { "sequence": false,
				    "generic" : null,
				    "nullable" : false,
				    "union" : false,
				    "idlType" : element_type,
				   },
		      "required": true,
		      "C_and_Jerryscript_Types": 
		           { "Jerryscript_Type": element_type,
			     "C_Type": element_type,
			     "is_array" : true,
		             "default_value": this.get_C_default_value(element_type)
			   }
		    });

	this.dictionaries[array_type] = {
	    "type" : "dictionary",
	    "dictionaryName": array_type,
	    "name" : array_type,
	    "members" : members,
	    "is_array_object": true,
	    "externalTypes": [],
	    "C_and_Jerryscript_Types":
	                          {"Jerryscript_Type": array_type,
				   "C_Type": array_type,
				   "default_value": array_type+"_constructor()"}
	};
	this.get_non_intrinsic_types_list(this.dictionaries[array_type]);
    }
} /* convert_list_of_array_types_to_dictionaries */


module.exports = AugmentedAST;








/*********************************************************************/
/* IGNORE FUNCTIONS BELOW THIS LINE!
/*********************************************************************/


/* TODO: we really don't handle variadic types correctly yet, so this
   function is probably useless */
/* we need to walk all of the ast to figure out what kind of array types
   (remember that variadic parameters are also arrays) we'll need --
   these will turn into <type>_Array types in the C code */
/* SIDE EFFECT: sets "variadic" to true on the last arguments'
   C_and_Jerryscript_Types (if that argument is variadic :-) -- also
   sets "array" to true on arguments' C_and_Jerryscript_Type */
AugmentedAST.prototype.get_the_list_of_array_types = function(variadics)
{
    let types = {};

    let create_array_object =
	    function(type) {return {"type": "array", "C_and_Jerryscript_Types": type};};

    /* SIDE_EFFECT: sets the ".array" field in the C_and_Jerryscript_Types
       object */
    /* the "member" parameter is either a operation argument or the
       operation return type -- the key is that it will have a
       C_and_Jerryscript_Type field */
    let add_type_to_list =
	    function(member, list)
            {
		/* Object.assign copies memory rather than the reference */
		let type = Object.assign({}, member.C_and_Jerryscript_Types);
		list[type.C_Type] = create_array_object(type);
		member.C_and_Jerryscript_Types.is_array = true;
            }; /* add_type_to_list */
    /* callbacks and operations have the same data structure, so we've
       abstracted the shared functionality into this routine */
    /* SIDE_EFFECT: sets the ".variadic" field in the C_and_Jerryscript_Types
       object */
    let add_arguments_that_are_arrays_to_list =
	    function(arguments_list)
            {
		for (let argument of arguments_list)
		{
		    if(argument.idlType.array > 0)
			add_type_to_list(argument, types);

		    /* variadic arguments are just arrays of arguments of
		       that type -- this is the only place in WebIDL that
		       you can get an array of arrays -- if that's the case
		       for an argument, the array type will have been
		       entered into the list (above), and we just need
		       to enter the array-of-arrays type here... (and if it's
		       not the case, then we need to add the array type here) */
		    if (argument.variadic)
		    {
			if (argument.idlType.array > 0)
			{
			    /* Object.assign copies memory rather than
			       the reference */
			    let type = Object.assign({}, argument.C_and_Jerryscript_Types);
			    type.C_Type = type.C_Type+"_Array";
			    type.is_string = false; /* kludge, but we know
						       it's true */
			    /* IS IT CORRECT TO SET THE JERRYSCRIPT TYPE?!? */
			    type.Jerryscript_Type =
				               type.C_Type;

			    add_type_to_list({"C_and_Jerryscript_Types":type}, types);
			}
			add_type_to_list(argument, variadics);

			/*argument.C_and_Jerryscript_Types.is_variadic = true;*/
		    }
		}
	    }; /* add_arguments_that_are_arrays_to_list */

    for(let dictionary in this.dictionaries)
    {
	let next = this.dictionaries[dictionary];

	for (let member of next.members)
	    if (member.idlType.array > 0)
		add_type_to_list(member, types);
    }

    for(var next_interface in this.interfaces)
    {
	let operations = this.interfaces[next_interface].operations;

	for (let operation of operations)
	{
	    /* single check of the return type of the operation */
	    if (operation.idlType.array > 0)
		add_type_to_list(operation, types);

	    add_arguments_that_are_arrays_to_list(operation.arguments,
						 this.getConversionTypes);
	}
    }

    for(let next in this.callbacks)
    {
	let callback = this.callbacks[next];

	/* single check of the return type of the callback */
	if (callback.idlType.array > 0)
	    add_type_to_list(operation, types);

	add_arguments_that_are_arrays_to_list(callback.arguments,
					     this.getConversionTypes);
    }

    return types;
}; /* get_the_list_of_array_types */

/*********************************************************************/
/* End of -- IGNORE FUNCTIONS BELOW THIS LINE! -- section
/*********************************************************************/

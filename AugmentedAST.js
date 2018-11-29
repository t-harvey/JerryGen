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
		    external_inheritance: "external_inheritance",
		    cyclic_inheritance: "cyclic_inheritance",
		    cyclic_structs: "cyclic_structs" };

AugmentedAST.error_codes = error_codes;


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


/* CONSTRUCTOR */
/* processes the given AST for errors, and produces an augmented
   version of the ast with easy access to the defined dictionaries,
   interfaces, types, and other definitions in the idl */
function AugmentedAST(ast,
		      fix_type_errors, leave_enums_alone,
		      tied_to_jerryscript, moduleName)
{
    this.ast = ast;
    this.moduleName = moduleName;
    this.isAugmented = false;
    this.fix_type_errors = fix_type_errors;
    this.leave_enums_alone = leave_enums_alone;
    this.tied_to_jerryscript = tied_to_jerryscript;

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
					 'object', 'Error', 'JSON' ];

/* we store multi-word C types (like "unsigned int") as a space-removed
   string for ease of manipulation, so when we're checking for valid
   types, we'll need to look for these, not, e.g., "unsigned int" */
AugmentedAST.prototype.CTypes = [ "int8_t", "uint8_t", "int16_t", "uint16_t",
				  "int32_t", "uint32_t", "int64_t", "uint64_t",
				  "bool", "_object",
				  'unsignedlong', 'longlong',
				  'unsignedlonglong', 'unrestrictedfloat',
				  'unrestricteddouble', 'Interpreter_Type',
				  'jerry_value_t' ];

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
           this.isArrayType     (tname) ||
           this.isCompositeType (tname) ||
           this.isTypedefType   (tname) ||
           this.isCType         (tname);
}; /* AugmentedAST.isAllowedType */

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

/* returns true if the given type has been defined as a dictionary in the IDL */
AugmentedAST.prototype.isCType = function (t)
{
    return this.CTypes.indexOf(this.getTypeName(t)) >= 0;
}; /* AugmentedAST.isCType */

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

/* returns true if the given type has been defined as an array */
AugmentedAST.prototype.isArrayType = function (t)
{
    return this.array_types[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isArrayType */

/* returns true if the given type has been defined as a composite type */
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
    let intrinsic_C_Types = {  byte:     0    ,
			       int8_t:   0    ,
			       uint8_t:  0    ,
			       int16_t:  0    ,
			       uint16_t: 0    ,
			       int32_t:  0    ,
			       uint32_t: 0    ,
			       int64_t:  0    ,
			       uint64_t: 0    ,
			       float:    0.0  ,
			       double:   0.0  ,
			       string:   "\"\"" ,
			       bool:     false,
			       Error: "\"\"", 
			    };
    let intrinsic_C_Types2 = {  byte:   0    ,
			       uint8_t:  0    ,
			       short:  0    ,
			       "uint16_t": 0    ,
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
	return this.fix_names_and_types(C_Type, "idlType") + "_constructor()";
} /* AugmentedAST.get_C_default_value */


AugmentedAST.prototype.WebIDL_to_Jerryscript_TypeMap = {
	"any"                 : "any",
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

AugmentedAST.prototype.C_to_Jerryscript_TypeMap = {
	"any"         : "any",
	"ArrayBuffer" : "ArrayBuffer",
	"bool"        : "boolean",
	"int8_t"      : "number",
	"uint8_t"     : "number",
	"int16_t"     : "number",
	"uint116_t"   : "number",
	"int32_t"     : "number",
	"uint32_t"    : "number",
	"int64_t"     : "number",
	"uint64_t"    : "number",
	"float"       : "number",
	"double"      : "number",
        "string"      : "string",
        "Error"       : "Error",
        "object"      : "_object",
	"this"        : "this",
        "Interpreter_Type" : "this",
        "jerry_value_t" : "this"
    }; /* C_to_Jerryscript_TypeMap */


AugmentedAST.prototype.WebIDL_to_C_TypeMap2 = {
	"any" : "any",
	"ArrayBuffer": "ArrayBuffer",
	"boolean" : "boolean",
	"byte" : "byte",
	"octet" : "uint8_t",
//	"octet" : "octet",
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
    }; /* WebIDL_to_C_TypeMap2 */

AugmentedAST.prototype.WebIDL_to_C_TypeMap = {
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
        "object"      : "_object",
        "Error": "Error",
	"this" : "Interpreter_Type"
    }; /* WebIDL_to_C_TypeMap */

/* record all of the names of typedefs in our input; 
/* SIDE EFFECT: creates the AugmentedAST.typedefs list */
AugmentedAST.prototype.record_typedefs = function(ast)
{
    this.typedefs = new Object;
    let this_ptr = this;

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

	    if (!(this_ptr.isPrimitiveType(typedefs_list[current].ultimate_typename)))
		typedefs_list[current].include =
		                     typedefs_list[current].ultimate_typename;
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
	    let new_typedef = {typedefName: ast[i].name, type: base_type};

	    this.fix_names_and_types(new_typedef, "typedef");

	    this.typedefs[new_typedef.typedefName] = new_typedef;
	    
	}

    /* second, build a tree of typedefs and figure out what type they're
       ultimately aliased to -- b/c it's perfectly okay to typedef a->b->c...
       and we need to know what the "ultimate" type is so that we can
       include the proper .h file to support its use */
    let types = Object.keys(this.typedefs);
    for(var i = 0; i < types.length; i++)
    {
	find_ultimate_typename(types[i], this.typedefs, []);
	this.typedefs[types[i]].ultimate_typename_C_type =
	      this.idlTypeToOtherType(this.typedefs[types[i]].ultimate_typename,
				      this.WebIDL_to_C_TypeMap);
    }

    /* finally, add these to the list to check for later */
    /* TODO: should we do this with the ultimate_type? */
//    for(var i = 0; i < this.typedefs.length; i++)
//	    this.addToTypeCheckQueue(this.typedefs[i].typedefName);

} /* record_typedefs */


/* return a struct with the C and Jerryscript types for the WebIDL type
   passed in */
AugmentedAST.prototype.getConversionTypes = function(idlType,
						     is_variadic = false)
{
    let return_types = {};

    return_types.C_Type = this.idlTypeToOtherType(idlType,
					    this.WebIDL_to_C_TypeMap,
					    is_variadic);

    return_types.Jerryscript_Type = 
	               this.C_to_Jerryscript_TypeMap[return_types.C_Type];
    if (typeof return_types.Jerryscript_Type === "undefined")
	return_types.Jerryscript_Type = return_types.C_Type;

    if (idlType.array > 0)
    {
	return_types.element_type = idlType.element_type;
	return_types.is_array = true;
    }

    /* the "this" pointer can only occur (in the WebIDL) as the return
       type of a function; mark it here for easy identification */
    if (return_types.Jerryscript_Type === "this")
	return_types.return_is_this = true;

    /* strings are messy in C, so mark them for special handling later */
    if (return_types.Jerryscript_Type === "string")
	return_types.is_string = true;

    /* the only reason we need this is for the highly questionable
       requirement that we support "jerry_value_t" instead of
       "Interpreter_Type" -- the problem is that there are a number of
       places that cannot distinguish between between Jerryscript's
       "object" type and WebIDL's "object" thing, so add (yet another)
       boolean for WebIDL "object"s */
    if (return_types.Jerryscript_Type === "object")
	return_types.is_object = true;

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
    /* ...and if the default value is a constructor, we'll want to be
       able to put out an extern declaration before using it */
    if (typeof(return_types.default_value) === "string" &&
	return_types.default_value.length ==
	          (return_types.default_value.indexOf("_constructor()") +
	           "constructor()".length))
	return_types.default_value_extern = "extern " +
	                                    return_types.default_value + ";";

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
		throw new Error("External type declarations take a single parameter representing the name of the type.");
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
	/* the parser will let the extAttrs array have entries that
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
   attribute; we assume that the ExternalTypes array has already been built
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
  non_intrinsic_types list TODO: fix this? */
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

	if (type === "ArrayBuffer")
	    type = "byte_array";

	if (!(this_ptr.isPrimitiveType(type)) &&
	    !(this_ptr.isCType(type)))
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
<	                      {return intrinsics_list.indexOf(item)==pos;});*/
    /* ...but this fails, b/c indexOf doesn't like objects (it's the perennial
       difference between == and ===) -- so I substituted the following, which
       I got off of http://tinyurl.com/yabbcs8v */
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
    /* NOTE: assumes that thing.externalTypes has been set up! */
    thing.non_intrinsic_types = [];
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
   then we'll add a trailing underscore to make the code compilable */
AugmentedAST.prototype.local_reserved_words = []; /* from fix_names(), below */
AugmentedAST.prototype.fix_names_and_types = function(thing, type_of_thing)
{
    let NOT_A_VARIABLE = false;
    let this_ptr = this;

    /* we need to distinguish between type-name replacement and variable-name
       replacement -- when a valid WebIDL type name is the same as a C type,
       we just leave those alone; so when we examine a variable name, we
       look at both lists, but when we're examining types, we only look
       at the second list */
    let C_reserved_type_words = [ "bool", "double", "float", "int", "long", "short", "void" ];

    let C_reserved_words = [ "auto", "break", "case", "char",
			     "const", "continue", "default", "do",
			     "else", "enum", "extern", "for",
			     "goto", "if", "inline", "int",
			     "register", "restrict", "return",
			     "signed", "sizeof", "static", "struct",
			     "switch", "typedef", "union", "unsigned",
			     "volatile", "while", "true", "false" ];

    /* this is just to handle scoping; we don't change the list... */
    let local_reserved_words = this.local_reserved_words;

    /* this is the fixer for every name in the file... */
    let fix_name = function(name, variable_name = true)
    {
	/* a "while" loop is probably overkill, but it's safe... */
	while (C_reserved_words.indexOf(name)           >= 0 ||
	       C_reserved_type_words.indexOf(name)      >= 0 ||
	       (variable_name && local_reserved_words.indexOf(name) >= 0))
	    name += "_";

	if (!variable_name)
	    this_ptr.addToTypeCheckQueue(name);

	return name;
    } /* fix_name */

    /* this is the fixer for every type name in the file...the set of
       restricted type names is a subset of set of names that can't be
       used for variable names */
    let fix_type = function(name)
    {
	/* like fix_name, above, this while-loop is probably overkill... */
	while (C_reserved_words.indexOf(name) >= 0)
	    name += "_";

	this_ptr.addToTypeCheckQueue(name);

	return name;
    } /* fix_type */

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

	return fix_name(return_string);
    } /* fix_enum */

    /* callbacks and operations work the same way, so we've abstracted out
       their code */
    let process_call = function(call)
    {
	call.C_and_Jerryscript_Types.C_Type =
	                         fix_type(call.C_and_Jerryscript_Types.C_Type);
	// fix argument names/types
	for (let j = 0; j < call.arguments.length; j++)
	{
	    let argument = call.arguments[j];
	    argument.name = fix_name(call.arguments[j].name);
	    argument.C_and_Jerryscript_Types.C_Type =
		            fix_type(argument.C_and_Jerryscript_Types.C_Type);
	}

	call.number_of_non_variadic_params = call.arguments.length;
	if (call.arguments.length > 0 &&
	    call.arguments[call.arguments.length-1].variadic)
	{
	    call.number_of_variadic_params = 1;
	    call.number_of_non_variadic_params--;
	}
    }; /* process_call */


    /* not only looks to change the name of the thing, but also the key
       in the list of those things */
    let change_thing_name_if_necessary = function(thing_name, list_of_things)
    {
	let original_name = thing_name;
	let new_name = fix_name(thing_name, NOT_A_VARIABLE);

	if (original_name != new_name)
	{
	    let temp = list_of_things[original_name];
	    delete list_of_things[original_name];
	    list_of_things[new_name] = temp;
	}
	return new_name;
    }; /* change_thing_name_if_necessary */


    switch(type_of_thing)
    {
	case "interface":
	{
	    thing.interfaceName = change_thing_name_if_necessary(
		                         thing.interfaceName, this.interfaces);
	    /* TODO: WHAT ABOUT THE RETURN TYPE?!? */
	}
	break;

	case "attribute":
	{
	    /* for an interface's attribute, we only need look at its type,
	       b/c the name is never referenced in C except as a string */
	    thing.attributeName = fix_name(thing.attributeName);

	    let original_C_Type = thing.C_and_Jerryscript_Types.C_Type;
	    let original_Jerryscript_Type =
		                 thing.C_and_Jerryscript_Types.Jerryscript_Type;

	    thing.C_and_Jerryscript_Types.C_Type =
		fix_type(thing.C_and_Jerryscript_Types.C_Type);

	    if ( original_Jerryscript_Type === original_C_Type &&
		 thing.C_and_Jerryscript_Types.C_Type != original_C_Type)
		thing.C_and_Jerryscript_Types.Jerryscript_Type = fix_type(original_Jerryscript_Type);
	}
	break;

	case "operation":
	{
	    /* don't change the name of the operation, b/c: a) the
	       name is used by the Javascript'er, and b) the names
	       on the C side get concatenated with the interface
	       name, so there's no way it'd be a reserved word */
	    process_call(thing);
	}
	break;

	/* callbacks work the same way as an interface's operations */
	case "callback":
	{
	    thing.callbackName = change_thing_name_if_necessary(
		                         thing.callbackName, this.callbacks);
	    process_call(thing);
	}
	break;

	case "dictionary":
	{
	    thing.dictionaryName = change_thing_name_if_necessary(
		                      thing.dictionaryName, this.dictionaries);

	    for (let i = 0; i<thing.members.length; i++)
	    {
		thing.members[i].memberName = fix_name(thing.members[i].memberName);
		let original_C_Type = thing.members[i].C_and_Jerryscript_Types.C_Type;
		let original_Jerryscript_Type = thing.members[i].C_and_Jerryscript_Types.Jerryscript_Type;
		thing.members[i].C_and_Jerryscript_Types.C_Type = fix_type(original_C_Type);
		if ( original_Jerryscript_Type === original_C_Type &&
		    thing.members[i].C_and_Jerryscript_Types.C_Type != original_C_Type)
		    thing.members[i].C_and_Jerryscript_Types.Jerryscript_Type = fix_type(original_Jerryscript_Type);
	    }
	}
	break;

	case "enum":
	{
	    thing.enumName = change_thing_name_if_necessary(thing.enumName,
							    this.enums);

	    for(let i = 0; i <  thing.values.length; i++)
		thing.values[i].C_value = fix_enum(
		                           thing.values[i].C_value);
	}
	break;

	case "typedef":
	{
	    thing.typedefName = fix_name(thing.typedefName, NOT_A_VARIABLE);
	    thing.type = fix_type(thing.type);
	}
	break;

	case "idlType":
	{
	    /* this is kind of a kludge; sometimes, we just want a typename,
	       so, in various places, we just grab the idlType that the
	       parser gives us -- but these have to be fixed, so here we
	       go; TODO: remove all calls to get_idlType_string */
	    return fix_type(thing);
	}
	break;

	default:
	    throw "UNKNOWN TYPE GIVEN TO fix_names_and_types.";
	break;
    }
} /* fix_names_and_types */


/* ASSUMES: this.ast holds the array of things parsed */
/* the rules:
   1) no WebIDL construct (callback, interface, dictionary, typedef, or enum)
      can be called something that is already a reserved word in WebIDL;
      although this isn't technically illegal (examples of this make it
      thru the parser), it makes it impossible to do any type checking
      (e.g., which "any" is it, the user-defined one, or the WebIDL one?)
   2) no typedef, dictionary, or interface -- unless it is a module (because
      modules are invoked as strings(they're not new'd), and any string is
      fine) -- can be called something that is already a Javascript reserved
      word; while these names can be made legal, the paradigm is that the
      scripter reads the WebIDL and uses it (unchanged); so it's better to
      warn the guy compiling the WebIDL that he needs to change the name, and
      then the scripter just sees the correct WebIDL and doesn't see the problem
   3) this procedure must be called after record_typedefs, as that function
      changes the fields of the typedefs
*/
/* SIDE EFFECT: sets up this.local_reserved_words */
AugmentedAST.prototype.fix_names = function()
{
    /* I think the only WebIDL words we care about are those that
       describe types, since some of the WebIDL type names propagate
       through to the C code */
    /* note that this is the set of names not already in the above sets */
    let WebIDL_reserved_words = [ "any", "boolean", "byte", "long", 
				  "object", "octet", "record",
				  "sequence", "symbol", "unsignedshort",
				  "unsignedlong", "longlong",
				  "unsignedlonglong",
				  "unrestrictedfloat",
				  "unrestricteddouble", "DOMString",
				  "ByteString", "USVString",
				  "Promise", "Error", "Json" ];

    /* these were compiled from https://www.w3schools.com/js/js_reserved.asp */
    let Javascript_reserved_words = [ "abstract", "arguments",
		"break", "case", "catch",
		"class", "const", "continue", "debugger",
		"default", "delete", "do", "double", "else", "enum",
		"eval", "export", "extends", "false", "final", "finally",
		"float", "for", "function", "goto", "if", "implements",
		"import", "in", "instanceof", "let",
		"long", "native", "new", "null", "package", "private",
		"protected", "public", "return", "super",
		"switch", "synchronized", "this", "throw", "throws",
		"transient", "true", "try", "typeof", "var", "void",
		"volatile", "while", "with", "yield", "Array", "Date",
		"eval", "function", "hasOwnProperty", "Infinity", "isFinite",
		"isNaN", "isPrototypeOf", "length", "Math", "NaN", "name",
		"Number", "Object", "prototype", "String", "toString",
		"undefined", "valueOf", "onblur", "onclick", "onerror",
		"onfocus", "onkeydown", "onkeypress", "onkeyup",
		"onmouseover", "onload", "onmouseup", "onmousedown",
		"onsubmit" ];

    /* build and return the list of local type names */
    let build_local_type_names = function(this_ptr)
    {
	let local_type_names = [];

	/* throws an exception if the name passed in is not allowed; this
	   is b/c either the name is a res type, which will give us code
	   that won't compile, or it's a WebIDL typename that makes the
	   code ambiguous (imagine an interface named "any" -- how would
	   we tell it apart from the "any" type?) */
	let report_disallowed_name = function(name,
					      type_of_thing,
					      is_module = false)
	{
	    let check_for_JS_name = function(type_of_thing, is_module)
	    {
		if (type_of_thing === "interface" && !is_module)
		    return true;
		else if (type_of_thing === "dictionary" ||
			 type_of_thing === "typedef")
		    return true;
		else
		    return false;
	    }; /* check_for_JS name */

	    if (WebIDL_reserved_words.indexOf(name) >= 0
		||
	        (check_for_JS_name(type_of_thing, is_module) &&
		 Javascript_reserved_words.indexOf(name) >= 0))
	    {
		let article = function(type_of_thing)
		{
		    switch(type_of_thing[0])
		    {
			case "a": case "A":
			case "e": case "E":
			case "i": case "I":
			case "o": case "O":
			case "u": case "U":
		            return "an ";
		        default:
		            return "a ";
		    }
		 }; /* article */

		throw new Error("ERROR: " +
				article(type_of_thing) +
				type_of_thing +
				" cannot be named \"" + name +
				"\", as that word is reserved.");
	    }
	} /* report_disallowed_name */

	/* we only call this function if we know that the attribute is
	   one of ExternalInterface, ExternalDictionary, or ExternalCallback;
	   and if there's any syntax error (which will be caught later),
	   we'll just return a null string, which won't hurt anything */
	let get_attribute_value = function(attribute)
	{
	    let return_value = "";

	    if (typeof attribute.rhs != "undefined" &&
		typeof attribute.rhs.value != "undefined" &&
		Array.isArray(attribute.rhs.value) &&
		attribute.rhs.value.length >= 1 &&
		typeof attribute.rhs.value[0] === "string")

		return_value = attribute.rhs.value[0];

	    return return_value;
	} /* get_attribute_value */

	/* the ast the parser builds is really, really simple -- each
	   construct has a "name" field and a "type" field... */
	for (let i = 0; i < this_ptr.ast.length; i++)
	{
	    let this_thing = this_ptr.ast[i];
	    let name = this_thing.name;
	    let is_module = false;

	    /* names defined in external attributes need to be added to
	       the list, too */
	    for (let j = 0; j < this_thing.extAttrs.length; j++)
	    {
		let external_attribute = this_thing.extAttrs[j];
		let type_of_attribute = "";

		/* the parser will sometimes pass through an "undefined"
		   external attribute (TODO: b/c it reads the list poorly?),
		   so just skip over these... */
		if (typeof external_attribute === "undefined")
		    continue;

		if (external_attribute.name === "ReturnFromRequire")
		    is_module = true;

		if (external_attribute.name === "ExternalInterface")
		    type_of_attribute = "Externalnterface";
		else if (external_attribute.name === "ExternalDictionary")
		    type_of_attribute = "ExternalDictionary";
		else if (external_attribute.name === "ExternalCallback")
		    type_of_attribute = "ExternalCallback";

		if (type_of_attribute.length > 0)
		{
		    let attr_name = get_attribute_value(external_attribute);
		    report_disallowed_name(attr_name, type_of_attribute);
		}
	    }
	    /* aborts on disallowed name... */
	    report_disallowed_name(name, this_thing.type, is_module); 
	    local_type_names.push(this_ptr.ast[i].name);
	}
	return local_type_names;
    } /* build_local_type_names */

    this.local_reserved_words = build_local_type_names(this);

}; /* AugmentedAST.fix_names */


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
	for(var i = 0 ; i < d.members.length; i++)
	{
	    /* if the user declares an array with "sequence",
	       getConversionTypes will catch it; the problem is that the user
	       can also declare an array with "[]" (technically, this isn't
	       legal WebIDL, but it parses/builds), in which case, the idlType
	       structure will have a field called "array" whose value is "1"
	       (or "true"?) -- to keep the code simple, we'll just catch the
	       latter case and make it look like the former... */
	    if (d.members[i].idlType.array > 0)
		d.members[i].idlType.sequence = true;
	    d.members[i].memberName = d.members[i].name;
	                                           /* "name" is too generic */
	    d.members[i].C_and_Jerryscript_Types = this.getConversionTypes(d.members[i].idlType);
	    if (i+1 == d.members.length)
		d.members[i].finalMember = true;
	}
	//    console.log("    NOT existingDict, d.members");
    }
    
    // add an index to the dictionary members so it's easy to assign
    // to them when the user does a new
    for(var i = 0 ; i < d.members.length; i++)
	d.members[i].member_index = i;

    /* names and types need to be modified if they are reserved words... */
    this.fix_names_and_types(d, "dictionary");
    
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
	new_enum.values[i].C_value = enum_name + "_" + new_enum.values[i].Javascript_value;
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
    /* enum values can be different between C and Javascript, so we'll
       need to keep a version of each value for each language -- expand
       each member to an object so that we can store both values */
    for(i = 0 ; i < new_enum.values.length; i++)
	new_enum.values[i] = {"Javascript_value": new_enum.values[i]};

    /* to ensure that enum values are unique, we'll concatenate onto each
       value the name of its enum */
    if (!this.leave_enums_alone)
	this.expand_enums(new_enum);

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

    /* the name of the enum needs to be modified if it is a reserved word... */
    this.fix_names_and_types(new_enum, "enum");

    /* NOTE: we're copying over from the "members" array (which comes in
       from the parser) to the "values" array... (which is why we have(!)
       to call fix_names_and_types _BEFORE_ this loop...) */
    new_enum.members = [];
    new_enum.longest_Javascript_name_length = 0;
    for(var i = 0 ; i < new_enum.number_of_members; i++)
    {
	let new_object = {C_name    : new_enum.values[i].C_value,
		 Javascript_name    : new_enum.values[i].Javascript_value,
			  new_line  : "\n"};
	if (i === 0)
	    new_object.indentation = "";
	else
	    new_object.indentation = new Array("typedef enum {  ".length).join( " " );
	if (i+1 === new_enum.number_of_members)
	    new_object.finalMember = true;
	    
	new_enum.members.push(new_object);

	if (new_object.Javascript_name.length >
	                               new_enum.longest_Javascript_name_length)
	    new_enum.longest_Javascript_name_length =
	                                    new_object.Javascript_name.length;
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
      callback.C_and_Jerryscript_Types = this.getConversionTypes(callback.idlType);
      if (callback.C_and_Jerryscript_Types.C_Type === "void")
	  callback.voidReturnType = true;

      // purely for human-readability: figure out how to nicely format
      // the arguments (crude for now...)
      // the string will look like: "typedef <type> (*<name>) (", so
      // we need length("typedef ") + length(<type>)...
      var indentation_amount = "typedef ".length +
	                       callback.C_and_Jerryscript_Types.C_Type.length +
	                       " (*".length +
	                       callback.callbackName.length +
	                       ") ( ".length;
      callback.indentation = new Array(indentation_amount-2).join( " " );
      indentation_amount += "_wrapper".length;
      callback.wrapper_indentation = new Array(indentation_amount+1).join(" ");

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

      this.set_external_types(callback);
      
      /* names and types need to be modified if they are reserved words... */
      this.fix_names_and_types(callback, "callback");

      // get a list of types that will need to be included in the .c file for
      // this callback
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
	throw "The interface does not exist: " + interfaceName

    /* objects in Javascript have a function called "toString"
       that is called when the user tries to print out the object;
       if the WebIDL specifies an operation called "toString",
       this will supercede the default, and strange things happen;
       on the other hand, the user may have intended to overwrite
       this function, so we'll just print a warning to alert the user */
    /* TODO: what other function names should we warn about? */
    if (interfaceMember.name === "toString")
	console.log("WARNING: having an interface member named \"toString\" overwrites Javascript's own \"toString\", resulting in unexpected behavior.");

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
	this.fix_names_and_types(interfaceMember, "operation");
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
	this.fix_names_and_types(attributeMember, "attribute");
	this.interfaces[interfaceName].attributes.push(attributeMember);

	this.interfaces[interfaceName].hasAttributes = true;
    }

}; /*AugmentedAST.addInterfaceMember */

/**
 * Adds an array of members to the interface.
 * @param interfaceName
 * @param interfaceMembers
 */
AugmentedAST.prototype.addInterfaceMembers = function (interfaceName, interfaceMembers) {
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
AugmentedAST.prototype.addNewInterface = function (newInterface)
{
    if (this.has_NoInterfaceObject_set(newInterface.extAttrs))
	newInterface.NoInterfaceObject = true;

    newInterface.operations = [];
    newInterface.attributes = [];
    newInterface.interfaceName = newInterface.name;
    delete newInterface.name; /* this avoids confusion in the Hogan compiler */
    /* names and types need to be modified if they are reserved words... */
    this.fix_names_and_types(newInterface, "interface");
    this.interfaces[newInterface.interfaceName] = newInterface;

    this.addInterfaceMembers(newInterface.interfaceName, newInterface.members);

    // add an index to the interface attributes so it's easy to assign
    // to them when the user does a new
    for(var i = 0 ; i < newInterface.attributes.length; i++)
	newInterface.attributes[i].attribute_index = i;

    /* mark the last attribute in the list (for later output -- we need to
       know when to put an enclosing brace) */
    if (newInterface.attributes.length > 0)
    {
	let last_attribute_index = newInterface.attributes.length-1;
	newInterface.attributes[last_attribute_index].final_attribute = true;
    }

    this.interface_names.push(newInterface.interfaceName);

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

  record_name(theInterface.name, "interface");

  // zephyr's idl contains operations with no return type, which is
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
	    var line1 = "The name \"" + construct_name + "\" is duplicated in ";

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
		    argument_type.callback_return_type = this.callbacks[this.getTypeName(argument_type.C_Type)].C_and_Jerryscript_Types;
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


/* for both dictionaries and interfaces, we need to walk up the
   object's inheritance chain, adding each parent's fields or
   attributes and operations to each object's list; this is an
   inherently recursive procedure (if A inherits from B, which
   inherits from C, we first need to add C's interfaces and operations
   to B before adding B's fields to A); NOTE: this assumes that all
   parents are defined in this file or have been include'd on the
   command line -- otherwise, we won't be able to define the whole chain */
AugmentedAST.prototype.find_inheritance_chain = function(objects_list)
{
    let already_seen = [];

    /* these two functions are passed in to augment_object, one
       for when we're looking at dictionaries, and the other for when
       we're looking at interfaces; each returns the number of fields
       added to the target */

    let augment_dictionary = function(parent, target)
    {
	let number_of_parent_fields_copied = 0;

	/* make sure that we have valid places to put "parent"'s fields */
	if (target.members === undefined)
	    target.members = [];

	/* we walk backwards through the parent's members array and
	   stick each one onto the front of the target's members array;
	   this keeps them in the original order but preceding target's
	   own list */
	let existing_members = target.members.map(a => a.memberName);
	for(var i = parent.members.length-1; i >= 0; i--)
	{
	    var member = parent.members[i];
	    if (existing_members.indexOf(member.memberName) < 0)
	    {
		target.members.unshift(member);
		number_of_parent_fields_copied++;
		
		/* Note that we don't need to add memberName
		   to the existing_members list, as parent can't
		       have multiple members with the same name */
	    }
	}
	return number_of_parent_fields_copied;
    } /* augment_dictionary */

    let augment_interface = function(parent, target)
    {
	let number_of_parent_fields_copied = 0;

	/* make sure that we have valid places to put "parent"'s fields */
	if (target.operations === undefined)
	    target.operations = [];
	if (target.attributes === undefined)
	    target.attributes = [];

	/* we walk backwards through the parent's attributes array and
	   stick each one onto the front of the target's attributes array;
	   this keeps them in the original order but preceding target's
	   own list (we don't bother to do this for operations, since
	   their order doesn't matter) */
	let existing_attributes = target.attributes.map(a => a.attributeName);
	for(var i = parent.attributes.length-1; i >= 0; i--)
	{
	    var attribute = parent.attributes[i];
	    if (existing_attributes.indexOf(attribute.attributeName) < 0)
	    {
		target.attributes.unshift(attribute);
		number_of_parent_fields_copied++;
		target.hasAttributes = true;
		
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
		    new_operation.parent = parent.interfaceName;
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
	return number_of_parent_fields_copied;
    } /* augment_interface */

    /* copies the attributes and operations from the interface named
       "parent_name" to "target" -- this function recurs if "parent_name"
       inherits from another interface so that "parent_name" gets filled
       in before trying to copy it to "target"; the recursion stops when
       an interface has an empty "inheritance" field */
    let augment_object = function(parent_name,
				      target, augment_thing, seen_in_this_chain)
    {
	let number_of_parent_fields_copied = 0;

	let get_object_name = function(thing)
	{
	    if (thing.dictionaryName != undefined)
		return thing.dictionaryName;
	    else if (thing.interfaceName != undefined)
		return thing.interfaceName;
	    else
		throw "ERROR: find_inheritance_chain called with unknown type.";
	} /* get_object_name */
	let target_name = get_object_name(target);

	seen_in_this_chain.push(target_name);
	already_seen.push(target_name);

	if (parent_name != null)
	{
	    let parent = objects_list[parent_name];

	    /* TODO: what if they've included a different type (e.g., a
	       dictionary that includes an interface)? */
	    if (parent === undefined)
	    {
		/* an obvious error is to try to use an external type
		   as one's parent, but we have no way to support this */
		if (target.externalTypes.map(x => x.type).indexOf(parent_name) >= 0)
		    throw {"message"    : error_codes.external_inheritance,
			   "object_name": target_name,
			   "parent_name": parent_name };
		else
		    throw "Can't find a definition of \"" + parent_name + "\" to use in defining \"" + target_name + "\".";
	    }

	    /* we keep two lists of names that have been "seen" -- the
	       first is already_seen, which is a global (to this function)
	       list that is, essentially, a memoization list (it keeps us
	       from doing work we've already done), and the second is the
	       list that this function uses, which starts empty for each
	       new object and then keeps track of the objects in the
	       current inheritance chain; it's this second list that lets
	       us find cycles in the inheritance chain */
	    if (seen_in_this_chain.indexOf(parent_name) >= 0)
	    {
		throw { "message"        : error_codes.cyclic_inheritance, 
			"objects_list"   : objects_list,
			"first_in_chain" : target_name };
	    }

	    /* fully define parent before copying it to target */
	    if (already_seen.indexOf(parent_name) < 0)
		augment_object(parent.inheritance, parent,
			       augment_thing, seen_in_this_chain);

	    number_of_parent_fields_copied = augment_thing(parent, target);
	}

	/* if we include parent's .h file, we'll trivially get all
	   of the #include's necessary to include all of the types
	   that parent uses (and that we now use, since we're
	   copying all of parent's constiuent parts), so add parent to
	   the list of "non_intrinsic_types" */
	/* but only add the include if we actually copied even a single
	   field from the parent */
	if (number_of_parent_fields_copied > 0)
	    if (target.non_intrinsic_types.filter(x=>x.type_name === parent_name).length === 0)
		target.non_intrinsic_types.push({type_name: parent_name});
	else
	    /* if no parent fields are copied, is this an error? */
	    /* no -- this conditional is fallen through to if the
	       object has no inheritance, so this is correct... */
	    ;
    } /* augment_object */

    /* we're going to assume that included fields/attributes should be
       in the order of earliest parent first -- i.e., closest to the
       object (so really far away ancestors count the least, in the
       sense that they won't be included if an earlier ancestor also
       provided something with the same name) */
    for (var i in objects_list)
    {
	if (already_seen.indexOf(i) < 0)
	{
	    let this_object = objects_list[i];
	    let parent_name = this_object.inheritance;
	    /* this is not a perfect test, but the test is more complete
	       inside of augment_object */
	    let is_dictionary = this_object.dictionaryName != undefined; 

	    augment_object(parent_name,
			   this_object,
			   (is_dictionary)? augment_dictionary:
			                    augment_interface,
			   []);
	}
    }
} /* AugmentedAST.find_inheritance_chain */



/* we need to make sure that objects don't recursively define themselves
   (e.g., type a has a field of type b, and type b has a field of type a),
   so walk all dictionaries and interfaces looking for recursive types and
   raise an exception if found */
AugmentedAST.prototype.recursive_type_check__seen = [];
AugmentedAST.prototype.ensure_no_recursion_in_types = function(objects)
{
    let objects_keys = Object.keys(objects);

    for(let i = 0; i < objects_keys.length; i++)
	this.walk_object_graph(objects_keys[i], objects, objects_keys, []);

} /* ensure_no_recursion_in_types */

/* used by ensure_no_recursion_in_types, above */
AugmentedAST.prototype.walk_object_graph = function(current, objects,
						    objects_keys, current_seen)
{
    /* TODO: FIX THIS EXCEPTION TO SHOW THE CYCLE */
    if (current_seen.indexOf(current) >= 0)
	throw { "message"        : error_codes.cyclic_structs,
                "objects_list"   : current_seen,
                "first_in_chain" : current };

    if (this.recursive_type_check__seen.indexOf(current) >= 0)
	return;

    current_seen.push(current);
    this.recursive_type_check__seen.push(current);

    let members;

    /* NOTE: assumes that all members and attributes lists' members have
       a C_and_Jerryscript_Types object... */
    if (objects[current].type === "dictionary")
	members = objects[current].members;
    else /* objects[current].type === "interface" */
	members = objects[current].attributes;

    for (let i = 0; i < members.length; i++)
    {
	let member = members[i];
	let member_type = member.C_and_Jerryscript_Types.C_Type;
	
	if (objects[member_type] != undefined)
	    this.walk_object_graph(member_type, objects,
				   objects_keys, current_seen);
    }

    current_seen.pop(current);

} /* walk_object_graph */


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
	/* this is for Mustache output: */
	new_c_and_j_type_list[0].first_in_list = true;
	composite["c_and_j_type_list"] = new_c_and_j_type_list;

	/* we'll need to name each field by its webidl name, so record that
	   in each type's entry */
	for (var i =0; i < composite["c_and_j_type_list"].length; i++)
	    composite["c_and_j_type_list"][i].webidl_name =
		webidl_type_list[i].replace(/ /g,''); /* remove whitespace */
    }; /* build_type_list_from_webidl_list */

    /* because Javascript only has a single numeric type, we want to convert
       Javascript values into the largest C type so as to keep from losing
       bits; this routine will build a subset of the c_and_j_type_list with
       only a single (the largest) numeric (C) type and then store this
       filtered list in j_to_c_type_list in the composite -- we'll use this
       list to order the type checking/assignment when building a composite
       type from the Javascript value */
    let filter_numeric_types = function(composite)
    {
	var filtered_list = [];
	/* we'll arbitrarily define unsigned's to be bigger than signed's,
	   and floating-point trumps any integral value */
	var c_type_size = { boolean:  1,
			    bool:     1,
			    int8_t:   7 ,
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
	    if      (typeof x == "undefined") return false;
	    else if (typeof y == "undefined") return true;

	    return (c_type_size[x.C_Type] > c_type_size[y.C_Type]);
	}; /* greater_than */

	var largest_numeric_type = undefined;
	var c_and_j_type_list = composite.c_and_j_type_list;
	var boolean_type_copy = undefined; /* defined if we see "boolean"... */
	for(var i = 0; i < c_and_j_type_list.length; i++)
	{
	    var this_type = Object.assign({}, c_and_j_type_list[i]);

	    /* if the C_Type field isn't numeric, just put it onto the new
	       list */
	    if (typeof c_type_size[this_type.C_Type] == "undefined")
		filtered_list.push(this_type);
	    else if (this_type.C_Type === "bool")
		boolean_type_copy = this_type;
	    else if (greater_than(this_type, largest_numeric_type))
		largest_numeric_type = this_type;
	}

	/* stick the largest numeric type we found onto the end of the list */
	if (typeof largest_numeric_type != "undefined")
	    filtered_list.push(largest_numeric_type);
	/* ...and, if necessary, stick a boolean check at the *very* end
	   of the list... */
	if (typeof boolean_type_copy != "undefined")
	    filtered_list.push(boolean_type_copy);

        /* this is for Mustache output: */
	filtered_list[0].first_in_list = true;
	filtered_list[filtered_list.length-1].last_in_list = true;

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

  if (this.tied_to_jerryscript)
      this.WebIDL_to_C_TypeMap["this"] = "jerry_value_t";

    /* record typedefs in their own structure (this.typedefs) -- we could(!)
       remove them from the ast, but right now, we just ignore them in the
       next loop... */
    this.record_typedefs(this.ast);

    /* must come after the call to record_typedefs!!! */
    this.fix_names();

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
    this.find_inheritance_chain(this.dictionaries);

    /* we need to make sure that no one creates data types that are recursive
       (e.g.,: a has a field of type b, and b has a field of type a) */
    this.ensure_no_recursion_in_types(Object.assign({}, this.interfaces,
					           this.dictionaries));
   
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
	idlType.element_type = new_type;

	/* create_array_type wants a particular data struture, so we'll
	   build one just to make it do what we want... */
	new_type = create_array_type({"items":new_type}, this.array_types);

	idlType.name = new_type;
	idlType.array = true;
    }

    return new_type;
}; /* AugmentedAST.idlTypeToOtherType */


/* this maps the idlType through the type_mapper and returns a string of
   the mapped type -- the type_mapper's "didn't find it" return value should
   be "undefined" */
AugmentedAST.prototype.idlTypeToOtherType_helper = function(idlType, type_mapper)
{
    if (typeof idlType == 'string')
    {
	var this_type = type_mapper[idlType];

	if (type_mapper != undefined)
	{	
	    if (this_type === undefined)
		this_type = idlType;
	}
	else
	    this_type = idlType;

	return this_type;
    }
    
    if (typeof idlType == 'object')
    {
	var object_is_array = function(x) { 
	                            return (typeof x.type != "undefined" &&
					    x.type == "array"); };
	if (object_is_array(idlType))
	{
	    return sequenceItemType = this.idlTypeToOtherType(idlType.items, type_mapper)+"_array";
	}
	else if (idlType.sequence)
	{
	    if (idlType.idlType)
	    {
		var sequenceDepth = idlType.sequence;
		/* arrays will always be the WebIDL type... */
		var sequenceItemType = this.idlTypeToOtherType(idlType.idlType, type_mapper);
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
	throw "ERROR: idlType not defined";
    if (typeof idlType === "string")
	return this.fix_names_and_types(idlType, "idlType");
    else if (idlType.composite === true || idlType.array === true)
	return this.fix_names_and_types(idlType.name, "idlType");
    else if (idlType.idlType === undefined)
	throw new Error("ERROR: Can't find idlType...");
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
	let is_string = (element_type === "string");
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
			     "is_string" : is_string,
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
			    type.element_type = type.C_Type;
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

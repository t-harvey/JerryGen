/* from https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/ -- this function is a more reliable "typeof" */
var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
};

var did_I_ever_see_a_string = false;
var did_I_ever_see_the_any_type = false;

var WebIDL_to_Jerryscript_TypeMap = {
    "boolean" : "boolean",
    "byte" : "number",
    "octet" : "number",
    "short" : "number",
    "unsigned short" : "number",
    "long" : "number",
    "unsigned long" : "number",
    "long long" : "number",
    "unsigned long long" : "number",
    "float" : "number",
    "unrestricted float" : "number",
    "double" : "number",
    "unrestricted double" : "number",
    "DOMString" : "string",
    "ByteString" : "string",
    "USVString" : "string",
    "this" : "this"
    /*    "object" : "*"/
    /*    "Interface types" : */
    /*    "Dictionary types" : */
    /*    "Enumeration types" : */
    /*    "Callback function types" : */
    /*    "Nullable types — T?" : */
    /*    "Sequences — sequence<T>" : */
    /*    "Promise types — Promise<T>" : */
    /*    "Union types" : */
    /*    "Error" : */
    /*    "DOMException" : */
}; /* WebIDL_to_Jerryscript_TypeMap */

var WebIDL_to_C_TypeMap = {
    /*"any" : "any", <-- gets replaced inside of the constructor */
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
    "this" : "jerry_value_t"
    /*    "object" : "*"/
    /*    "Interface types" : */
    /*    "Dictionary types" : */
    /*    "Enumeration types" : */
    /*    "Callback function types" : */
    /*    "Nullable types — T?" : */
    /*    "Sequences — sequence<T>" : */
    /*    "Promise types — Promise<T>" : */
    /*    "Union types" : */
    /*    "Error" : */
    /*    "DOMException" : */
}; /* WebIDL_to_C_TypeMap */

/*
 * uses the WebIDL_to_C_TypeMap to map primitive types to their
 * equivalent C types; returns undefined if it's not in the array
 */
function get_C_type(source) {
    return WebIDL_to_C_TypeMap[source];
}; /* get_C_type */


/**
 * Processes the given AST for errors, and produces an augmented version of the ast with easy access to the defined
 * dictionaries, interfaces, types, and other definitions in the idl.
 * @param ast
 * @constructor
 */
function AugmentedAST(ast, fix_type_errors, moduleName) {
  "use strict";

  this.ast = ast;
  this.moduleName = moduleName;
  this.isAugmented = false;
  this.fix_type_errors = fix_type_errors;

  this.dictionaries = Object.create(null);
  this.callbacks = Object.create(null);
  this.interfaces = Object.create(null);
  this.typedefs = Object.create(null);
  this.exceptions = Object.create(null);
  this.enums = Object.create(null);
  this.array_types = Object.create(null);
  this.variadic_types = Object.create(null);

  // the "any" type will end up being a union of all of the builtin
  // types and any types defined by the webidl; we'll name the C union
  // with the name of the module
  WebIDL_to_C_TypeMap["any"] = this.moduleName+"_types_union";

  // we use this queue to keep track of members, etc. that we need to check.
  this.typeCheckQueue = [];

  // we use this to squash the array
  this.removedIndices = [];

  // passing in an ast to the constructor starts augmenting it
  if (this.ast) {
    this.augment();
  }
    if (did_I_ever_see_a_string === true || Object.keys(this.enums).length > 0)
	this.uses_strings = true;

    if (did_I_ever_see_the_any_type === true)
    {
	this.uses_strings = true;
	this.uses_any_type = true;
	this.any_type_list = this.generateAnyTypeList();
    }

} /* constructor */


/**
 * An array of supported WebIDL primitive types (static)
 * @type {string[]}
 */
AugmentedAST.prototype.primitiveTypes = ['any', 'boolean', 'byte', 'octet', 'short', 'unsigned short', 'long',
                                         'unsigned long', 'long long', 'unsigned long long', 'float',
                                         'unrestricted float', 'double', 'unrestricted double', 'DOMString', 'void', 'string', 'this' ];

/**
 * Uses the augmented data to produce an array of types, including primitive, dictionary, interface, typedef, exception
 * and enum types that have been defined in the idl.
 * @returns {Array}
 */
AugmentedAST.prototype.generateAllowedTypesArray = function () {
  "use strict";
  return this.primitiveTypes.concat(Object.keys(this.dictionaries),
                                    Object.keys(this.callbacks),
                                    Object.keys(this.interfaces),
                                    Object.keys(this.typedefs),
                                    Object.keys(this.exceptions),
                                    Object.keys(this.enums));
};

/**
 * Uses the augmented data to produce an array of C types from the full
 * set of primitive types and types defined in the idl file -- this is
 * used for the "any" type
 * @returns {Array}
 */
AugmentedAST.prototype.generateAnyTypeList = function () {
    "use strict";
    let return_array = {};
    let suffix = "_var";

    /* the mustache parser wants an array of objects to iterate through, so
        we'll split up each of the kinds of things into their own object,
        each of which will just be a list */
    return_array["objects"] = [];
    return_array["callbacks"] = [];
    return_array["enums"] = [];

    /* dictionaries and interfaces are both objects, but we only
       add an interface to the list if it has attributes (b/c only
       then will it have a C struct defined for it) */
    let object_lists = [this.dictionaries, this.interfaces];
    let DICTIONARIES = 0;
    let first_in_list = true;
    for(let i = 0; i<2; i++)
    {
        for(let [key, value] of Object.entries(object_lists[i]))
        {
	    if (i == DICTIONARIES || value.hasAttributes)
            {
                let entry = {type: value.name, type_name: value.name+suffix};
                if (first_in_list)
                {
                    entry.first_in_list = true;
                    first_in_list = false;
                }
	       return_array["objects"].push(entry);
            }
        }
    }

    for(let [key, value] of Object.entries(this.callbacks))
    {
        let entry = {type: value.name+"_calling_context",
		     type_name: value.name+suffix};
	return_array["callbacks"].push(entry);
    }
    for(let [key, value] of Object.entries(this.enums))
    {
        let entry = {type: value.name, type_name: value.name+suffix};
	return_array["enums"].push(entry);
    }

    return return_array;
}; /* generateAnyTypeList */


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

    for(var interface in this.interfaces)
    {
	let operations = this.interfaces[interface].operations;

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


/* dictionaries have the following fields:
   type: "dictionary"
   name: <string>
   partial: <bool>
   members: [ <objects> ]
   inheritance: <pointer> ??? -- always seems to be null
   extAttrs [ ] -- always seems to be empty

   ...but the only fields we use are: name and members

   ...member objects have the following fields:
   type: <string>
   name: <string>
   required: <bool>
   idlType: <idlType>
   extAtrs: [ ] -- always seems to be empty
   schemaType: [ { $ref: <string> } ]
   C_and_Jerryscript_Types: created by getConversionTypes
   finalMember: <bool>

   ...and here, only name and C_and_Jerryscript_Types get used
*/
AugmentedAST.prototype.convert_list_of_array_types_to_dictionaries = function(array_types)
{
    for (let runner in array_types)
    {
	let next = array_types[runner];
	next.is_string = false; /* kludge; but we know it's true */
	let name = next.C_and_Jerryscript_Types.C_Type + "_Array";
	let members = [];
	let items_type = this.getConversionTypes(runner);
	items_type.is_array = true;

	members.push({"type": "field",
		      "name": "length",
		      "required": true,
		      "idlType" : { "sequence": false,
				    "generic" : null,
				    "nullable" : false,
				    "array" : false,
				    "union" : false,
				    "idlType" : "long",
				  },
		      "C_and_Jerryscript_Types": { "Jerryscript_Type": "unsigned long", "C_Type": "uint32_t"}
		    });
	members.push({"type": "field",
		      "name": "items",
		      "idlType" : { "sequence": false,
				    "generic" : null,
				    "nullable" : false,
				    "array" : 1,
				    "union" : false,
				    "idlType" : runner,
				   },
		      "required": true,
		      "C_and_Jerryscript_Types": items_type
		    });

	this.dictionaries[name] = {
	    "type" : "dictionary",
	    "name" : name,
	    "members" : members,
	    "is_array_object": true,
	    "C_and_Jerryscript_Types": next.C_and_Jerryscript_Types
	};
    }
} /* convert_list_of_array_types_to_dictionaries */

/**
 * Checks whether the given type is properly defined in the IDL.
 * @param t
 * @returns boolean
 */
AugmentedAST.prototype.isAllowedType = function (t) {
  var tname = this.getTypeName(t);
  return this.isPrimitiveType(tname) ||
         this.isDictionaryType(tname) ||
         this.isInterfaceType(tname) ||
         this.isCallbackType(tname) ||
         this.isExceptionType(tname) ||
         this.isEnumType(tname) ||
         this.isTypedefType(tname);
};

/**
 * Returns true if the given type is primitive
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isPrimitiveType = function (t) {
  return this.primitiveTypes.indexOf(this.getTypeName(t)) > -1;
};

/**
 * Returns true if the given type has been defined as a dictionary in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isDictionaryType = function (t) {
  return this.dictionaries[this.getTypeName(t)] != undefined;
};

/**
 * Returns true if the given type has been defined as an interface in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isInterfaceType = function (t) {
  return this.interfaces[this.getTypeName(t)] != undefined;
};

/**
 * Returns true if the given type has been defined as a callback in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isCallbackType = function (t) {
  return this.callbacks[this.getTypeName(t)] != undefined;
}; /* AugmentedAST.isCallbackType */

/**
 * Returns true if the given type has been defined as a typedef in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isTypedefType = function (t) {
  return this.typedefs[this.getTypeName(t)] != undefined;
};

/**
 * Returns true if the given type has been defined as an exception in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isExceptionType = function (t) {
  return this.exceptions[this.getTypeName(t)] != undefined;
};

/**
 * Returns true if the given type has been defined as an enum in the IDL
 * @param t
 * @returns {boolean}
 */
AugmentedAST.prototype.isEnumType = function (t) {
  return this.enums[this.getTypeName(t)] != undefined;
};

/**
 * Adds the given type to a queue of types that need to be checked.
 * The queue is checked after all definitions have been processed first.
 * @param t
 */
AugmentedAST.prototype.addToTypeCheckQueue = function (t) {
  "use strict";
//  console.log("        addToTypeCheckQueue: t = " + t);
  if (Array.isArray(t)) {
    // concat
    this.typeCheckQueue = this.typeCheckQueue.concat(t);
  } else {
    // push
    this.typeCheckQueue.push(t);
  }
}; /* addToTypeCheckQueue */

/**
 * Checks the given type is well defined.
 * In the process, adds more types to check depending on the type.
 * @param t
 * @returns {boolean}
 */
var counter = 0; /* useful for debugging */
AugmentedAST.prototype.checkType = function (t) {
    "use strict";
    //counter++;
    //console.log("            inside checkType("+counter+"): t = " + t);
    //if (counter === 6)
    //    console.log("counter = 6.");
    if (t === "string")
	did_I_ever_see_a_string = true;
    else if (t === "any")
	did_I_ever_see_the_any_type = true;

  // t could be an operation, attribute, constant member.
  if (t.type === 'operation') {
    // check return type
//      console.log("            OPERATION idlType");
    this.addToTypeCheckQueue(t.idlType);
    // check argument types
//      console.log("            OPERATION t.arguments");
    this.addToTypeCheckQueue(t.arguments);
  } else if (t.type === 'attribute') {
//      console.log("found an attribute: >" + t + "<");
    this.addToTypeCheckQueue(t.idlType);
  } else if (t.type === 'const') {
    // TODO Support constants
  } else if (t.type === 'string') {
      did_I_ever_see_a_string = true;
  } else if (t.idlType) {
      this.addToTypeCheckQueue(t.idlType);
  } else if ((typeof t === 'string' || t instanceof String) && (this.isAllowedType(t))) {
    // it could also be a string representing a type (base case)
  } else {
    throw "Unsupported type: " + t;
  }

  return true;
}; /* checkType */


/* return a struct with the C and Jerryscript types for the WebIDL type passed in */
AugmentedAST.prototype.getConversionTypes = function(idlType) {
    var return_types = {};
//    if (this.idlTypeToOtherType(idlType, WebIDL_to_Jerryscript_TypeMap) == "string")
//	console.log(idlType);
//    console.log(idlType);
    return_types.Jerryscript_Type = this.idlTypeToOtherType(idlType, WebIDL_to_Jerryscript_TypeMap);
    return_types.C_Type = this.idlTypeToOtherType(idlType, WebIDL_to_C_TypeMap);

    if (return_types.Jerryscript_Type === "string")
	return_types.is_string = true;
    else if (return_types.Jerryscript_Type === "this")
	return_types.return_is_this = true;

    /* (both the C and Jerryscript types will equal the Jerryscript type,
       so it doesn't matter which one we check for) */
//    console.log("LOOKING FOR " + return_types.C_Type + " === callback?");
    if (this.isCallbackType(return_types.C_Type))
    {
	return_types.callback = true;
	return_types.callback_return_type = this.callbacks[this.getTypeName(return_types.C_Type)].return_type;
    }

    if (idlType.array > 0)
	return_types.is_array = true;
//    if (return_types.C_Type === "PrintCallback1")
//    console.log("************************************************  CHECK = " + return_types.callback);
    return return_types;
}; /* AugmentedAST.getConversionTypes */

/**
 * Adds a dictionary to our map of dictionaries
 * @param d The original ast dictionary object
 * @param index The index this dictionary is in the original ast
 * @returns {boolean} True if added successfully, false otherwise.
 */
AugmentedAST.prototype.addDictionary = function (d, index) {
  "use strict";
  //A dictionary looks like this
  //{ type: 'dictionary', name: 'Di', partial: false, members: [ [Object],[Object] ], inheritance: null, extAttrs: [] }

  // does the dictionary already exist?
  var existingDict = this.dictionaries[d.name];
  if (existingDict) {
    // exists. Augment if partial, otherwise throw
    if (d.partial) {
      existingDict.members = existingDict.members.concat(d.members);
      // add the new members to the check queue
//      console.log("addDictionary:");
//      console.log("    existingDict, d.members");
      this.addToTypeCheckQueue(d.members);
      // get rid of duplicate
      this.ast[index] = null;
      this.removedIndices.push(index);
    } else {
      throw "The dictionary already exists: " + d.name;
    }
  }
  /* expects: 
     dictionary Jerry_TEST_CODE {
         string test_code = "...<Jerryscript code>...";
     };
  */
  else if (d.name === "Jerry_TEST_CODE") {
      this.test_code = d.members[0].default.value;
  } else {
    // doesn't exist. Add it as a new key.
    this.dictionaries[d.name] = d;
    // augment and add members
    for(var i = 0 ; i < d.members.length; i++){
      d.members[i].schemaType = this.idlTypeToSchema(d.members[i].idlType);
      d.members[i].C_and_Jerryscript_Types = this.getConversionTypes(d.members[i].idlType);
      if (i+1 == d.members.length)
	  d.members[i].finalMember = true;
    }
//    console.log("    NOT existingDict, d.members");
    this.addToTypeCheckQueue(d.members);
  }

  return true;
}; /* addDictionary */


/**
 * Adds an enum object to our map of enums
 * @param d The original ast dictionary object
 * @param index The index this dictionary is in the original ast
 * @returns {boolean} True if added successfully, false otherwise.
 */
AugmentedAST.prototype.addEnum = function (d, index) {
  "use strict";
  //A enumeration declaration looks like this:
  //{ type: 'enum', name: 'name', values: [ [string], [string], ... ], extAttrs: [] }

  // does the enum name already exist?
  var existingEnum = this.enums[d.name];
  if (existingEnum) {
      throw "The enum already exists: " + d.name;
  } else {
      // doesn't exist. Add it as a new key.
      this.enums[d.name] = d;

    // augment and add members
    d.number_of_members = d.values.length; // needed for mustache'ing
    if (d.values.length == 0)
	throw "Enumeration type with no values is not allowed";
    else if (d.values.length == 1)
	  d.onlyOneMember = true;

    d.members = [];
    for(var i = 0 ; i < d.values.length; i++){
	let new_object = {name: d.values[i], new_line: "\n"};
	if (i == 0)
	    new_object.indentation = "";
	else
	    new_object.indentation = new Array("typedef enum {  ".length).join( " " );
	if (i+1 == d.values.length)
	    new_object.finalMember = true;
	    
	d.members.push(new_object);
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
AugmentedAST.prototype.addCallback = function (d, index) {
  "use strict";
  //A callback looks like this:
  //{ type: 'callback', name: '<name>', idlType,
  //  arguments: [ { optional: bool, variadic: bool,
  //	             extAttrs: [], idlType, name: ' ' } ],
  //  extAttrs: [] }

  // does the callback already exist?
  var existingCallback = this.callbacks[d.name];
  if (existingCallback)
    // exists, so throw and exception
      throw "The callback already exists: " + d.name;
  else
  {
    // doesn't exist. Add it as a new key.
    if (Object.keys(this.callbacks).length === 0)
	d.first_in_list = true;
    this.callbacks[d.name] = d;
    d.return_type = this.getConversionTypes(d.idlType);
    if (d.return_type.C_Type === "void")
	d.voidReturnType = true;

    // purely for human-readability: figure out how to nicely format
    // the arguments (crude for now...)
    // the string will look like: "typedef <type> (*<name>) (", so
    // we need length("typedef ") + length(<type>)...
    var indentation_amount = "typedef ".length +
	                     d.return_type.C_Type.length +
	                     " (*".length +
	                     d.name.length +
	                     ") ( ".length;
    d.indentation = new Array(indentation_amount-2).join( " " );
    indentation_amount += "_wrapper".length;
    d.wrapper_indentation = new Array(indentation_amount+1).join( " " );

    // arguments with type info
    for(var i = 0 ; i < d.arguments.length; i++)
    {
      d.arguments[i].schemaType = this.idlTypeToSchema(d.arguments[i].idlType);
      d.arguments[i].C_and_Jerryscript_Types = this.getConversionTypes(d.arguments[i].idlType);
/*      d.arguments[i].C_and_Jerryscript_Types.is_variadic = d.arguments[i].variadic;*/

      if (i+1 === d.arguments.length)
	  d.arguments[i].separator = ")";
      else
	  d.arguments[i].separator = ",\n";

      if (i === 0)
	  d.arguments[i].firstArgument = true;

      if ((i+1) === d.arguments.length)
	  d.arguments[i].finalArgument = true;
	  
    }
    this.addToTypeCheckQueue(d.arguments);
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
    if (this.interfaces[interfaceName] == undefined)
	throw "The interface does not exist: " + interfaceName;

    if (interfaceMember.type === 'operation')
    {
	// we add schema type info to the operation first
	interfaceMember.schemaType =
	                        this.idlTypeToSchema(interfaceMember.idlType);
	interfaceMember.C_and_Jerryscript_Types =
	                     this.getConversionTypes(interfaceMember.idlType);

	if (interfaceMember.C_and_Jerryscript_Types.C_Type === "void")
	    interfaceMember.voidReturnType = true;

	interfaceMember.interfaceName = interfaceName;

	if(interfaceMember.extAttrs && interfaceMember.extAttrs.length > 0)
	    for(var i = 0; i < interfaceMember.extAttrs.length; i++)
		if(interfaceMember.extAttrs[i].name == "ThrowsRPCError")
		    interfaceMember.ThrowsRPCError = 
			                           interfaceMember.extAttrs[i];

	for(i = 0; i < interfaceMember.arguments.length; i++)
	{
	    interfaceMember.arguments[i].schemaType =
		   this.idlTypeToSchema(interfaceMember.arguments[i].idlType);
	    interfaceMember.arguments[i].C_and_Jerryscript_Types =
		 this.getConversionTypes(interfaceMember.arguments[i].idlType);
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
	attributeMember.name = interfaceMember.name;
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
	if (extAttrs[i].name === 'NoInterfaceObject')
	    return true;
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
  this.interfaces[newInterface.name] = newInterface;
  this.addInterfaceMembers(newInterface.name, newInterface.members);

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
  var existingI = this.interfaces[partialInterface.name];
  if (existingI && partialInterface.partial) {
    existingI.members = existingI.members.concat(partialInterface.members);
    this.addInterfaceMembers(partialInterface.name, partialInterface.members);

    // remove partial definition
    this.ast[index] = null;
    this.removedIndices.push(index);
  } else {
    throw "The interface already exists: " + partialInterface.name;
  }

}; /* addToExistingInterface */

/**
 * Adds a new or partial interface to the map.
 * @param theInterface the original interface object from the original ast.
 * @param index The index the object is in the original ast.
 * @returns {boolean} Returns true if added successfully, false otherwise.
 */
AugmentedAST.prototype.addInterface = function (theInterface, index, fix_type_errors) {
  "use strict";
  //An interface looks like this
  //{type:'interface', name:'In', partial:false, members:[ [Object],[Object] ], inheritance:null, extAttrs:[] }

  // zephyr's idl contains operations with no preceding type, which is
  // incorrect WebIDL -- should we complain and exit, or convert the
  // operation to returning a void (plus tell user that's what we did)?
  for (let operation_count in theInterface.members)
  { let operation = theInterface.members[operation_count];
      if (operation.name == null)
      {
	  if (operation.idlType !== undefined &&
	      typeof operation.idlType.idlType === 'string' &&
	      operation.idlType.idlType.length >= 1)
	  {
	      if (fix_type_errors)
	      {
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

  // does the dictionary already exist?
  var existingI = this.interfaces[theInterface.name];
  var interfaceMembers = [];
  if (existingI) {
    this.addToExistingInterface(theInterface, index);
  } else {
    // doesn't exist. Add it as a new key.
    this.addNewInterface(theInterface);
  }

  // augment the interface by adding operation fields.

  return true;
}; /* addInterface */

/**
 * checks each type in the queue of types to check
 * @returns {boolean}
 */
AugmentedAST.prototype.processTypeCheckQueue = function ()
{
    "use strict";
    while (this.typeCheckQueue.length !== 0)
    {
	if (!this.checkType(this.typeCheckQueue.pop()))
	    throw "Type error";
    }

    return true;
}; /* processTypeCheckQueue */


/**
 * marks the ast as having any callback types
 */
AugmentedAST.prototype.check_for_callback_types = function()
{
    this.has_callbacks = (Object.keys(this.callbacks).length > 0);
}; /* check_for_callback_types */


/**
 * any type can have a field, parameter, etc. that is another type -- when
 * we put out the C code, we need to ensure that we put out one type before
 * it's used in another type, so we need to sort all of the types into the
 * correct order for outputting.
 * walks all of the types and sets the ".sorted_types" list so that we put
 * put them out in the right order
 */
/* SIDE EFFECT: sets this.sorted_types_list */
var topological_sort = require('topsort'); var _ = require('lodash');
AugmentedAST.prototype.sort_types = function()
{
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
	let this_index = names.indexOf(callback.name);

	edges = edges.concat(callback.arguments.map(add_edge(this_index)).filter(remove_undefines));
    }
    for (let next in this.interfaces)
    {
	var interface = this.interfaces[next];
	let this_index = names.indexOf(interface.name);

	/* operations' arguments list */
	for (let operation of interface.operations)
	    edges = edges.concat(operation.arguments.map(add_edge(this_index)).filter(remove_undefines));
	/* attributes */
	edges = edges.concat(interface.attributes.map(add_edge(this_index)).filter(remove_undefines));	    
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
 * marks every operation that has a callback as a parameter, so that
 * we can output the extra "this" parameter to those stubs
 */
AugmentedAST.prototype.mark_operations_with_callback_parameters = function()
{
    for (var interface in this.interfaces)
    {
	let operations_array = this.interfaces[interface].operations;
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
		    //console.log(operation.name + "   " + argument.name);
		    operation.has_callback_parameters = true;
		}
	    }
	}
    }
} /* mark_operations_with_callback_parameters */


/**
 * Iterates over the ast and augments it by calling other methods in this class.
 * @param [ast]
 * @returns {AugmentedAST}
 */
AugmentedAST.prototype.augment = function (ast) {
  "use strict";
  // passing in an ast sets this.ast and starts augmenting
  if (ast) {
    this.ast = ast;
    this.isAugmented = false;
  }

  if (this.isAugmented) {
    return this; //already augmented
  }

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

    this.mark_operations_with_callback_parameters();

    // callbacks require a special data structure, which we only need to
    // put out if there are any callbacks in the ast
    this.check_for_callback_types();

    /* everytime we put out a type into the .h file, we need to also put
       out the "<type>_Array" type if anything in the file needs an array
       of those things; so this list holds the list of types that will
       require an associated "_Array" type and associated extractor/creator
       functions */
    /* variadic types are themselves arrays, although they require slightly
       different extractor functions -- we'll build up the list of variadic
       types, during execution of this function... */
    this.array_types = this.get_the_list_of_array_types(this.variadic_types);
    /* ...we'll take the arrays list and create dictionary entries for
       them -- this will put them into the sorting algorithm so we get
       them all put out in the correct order */
    this.convert_list_of_array_types_to_dictionaries(this.array_types);

    /* types need to be put out in the correct order -- e.g., if type A
       has a field of type B, we need to make sure that B gets outputted
       in the .h file before A */
    /* this function builds a list of types called sorted_types_list */
    this.sort_types();

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

AugmentedAST.prototype.idlTypeToSchema = function(idlType){
  if(typeof idlType == 'string'){
    return {"$ref": idlType};
  }

  if(typeof idlType == 'object'){
    if(idlType.sequence && idlType.idlType){
      // todo union types, etc.
      var sequenceDepth = idlType.sequence;
      var sequenceItemType = this.idlTypeToSchema(idlType.idlType);
      return this.idlSequenceToSchema(sequenceDepth, sequenceItemType);
    } else if(idlType.array > 0){
      return {"binary": true};
    } else if(idlType.idlType){
      return this.idlTypeToSchema(idlType.idlType);
    }
  }

  // if we haven't returned yet, there's a case we haven't handled...
  throw new Error("Couldn't handle idl type :" + JSON.stringify(idlType) );

}; /* AugmentedAST.idlTypeToSchema */



/* this maps the idlType through the type_mapper and returns a string of
   the mapped type -- the type_mapper's "didn't find it" return value should
   be "undefined" */
AugmentedAST.prototype.idlTypeToOtherType = function(idlType, type_mapper){
  if(typeof idlType == 'string'){
      var this_type = type_mapper[idlType];

      if (this_type === undefined)
	  this_type = idlType;

      return this_type;
  }

  if(typeof idlType == 'object'){
    if(idlType.sequence && idlType.idlType){
	throw new Error("CAN'T HANDLE SEQUENCES OF TYPES");
      // todo union types, etc.
      var sequenceDepth = idlType.sequence;
      var sequenceItemType = this.idlTypeToOtherType(idlType.idlType, type_mapper);
      return this.idlSequenceToSchema(sequenceDepth, sequenceItemType);
    } else if(idlType.idlType){
	/* recur */
	return this.idlTypeToOtherType(idlType.idlType, type_mapper);
    }
  }

  // if we haven't returned yet, there's a case we haven't handled...
  throw new Error("Couldn't handle idl type...");

}; /* AugmentedAST.idlTypeToOtherType */


AugmentedAST.prototype.idlSequenceToSchema = function(depth, itemType){
  //pre: itemType needs to be a schema...
  if(depth > 0){
    return {
      "type": "array",
      "items": this.idlSequenceToSchema(depth-1, itemType)
    };
  } else {
    return itemType;
  }
};



AugmentedAST.prototype.getInterfaceArray = function(){
  var out = [];
  for(var key in this.interfaces){
    out.push(this.interfaces[key]);
  }

  return out;
};

AugmentedAST.prototype.turn_object_into_array = function(x)
{
    var out = [];
    for(var key in x)
	out.push(x[key]);
    return out;
}; /* turn_object_into_array */


AugmentedAST.prototype.getDictionaryArray = function(){
  var out = [];
  for(var key in this.dictionaries){
    out.push(this.dictionaries[key]);
  }

  return out;
};

AugmentedAST.prototype.getEnumsArray = function(){
  var out = [];
  for(var key in this.enums){
    out.push(this.enums[key]);
  }
  return out;
}; /* getEnumsArray */

AugmentedAST.prototype.getCallbackArray = function(){
  var out = [];
  for(var key in this.callbacks){
    out.push(this.callbacks[key]);
  }
  return out;
}; /* getCallbackArray */

AugmentedAST.prototype.get_any_type_list = function(){
    return this.any_type_list;
}; /* get_any_type_list */

AugmentedAST.prototype.get_sorted_types_list = function(){
    return this.sorted_types_list;
}; /* get_any_type_list */

AugmentedAST.prototype.get_C_type_list = function(){
  if (this.C_type_list !== undefined)
      return this.C_type_list;
  else
      return undefined;
}; /* get_C_type_list */

AugmentedAST.prototype.getTestCodeArray = function(){
    var out = [];
    if ("test_code" in this)
	out.push(this.test_code);
    return out;
}; /* getTestCodeArray */


// we need to know if the ast has any interfaces so we can tell Hogan to put
// out the "register_function" function
AugmentedAST.prototype.get_hasOperations = function () {
    var out = [];
    for (var interface_runner in this.interfaces) {
	if (this.interfaces[interface_runner].operations.length > 0) {
	    out.push(true);
	    break;
	}
    }
    return out;
}; /* AugmentedAST.get_hasOperations */

module.exports = AugmentedAST;

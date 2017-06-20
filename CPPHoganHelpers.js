var _ = require("lodash");
var hogan = require("hogan.js");


var STDIDLTypeMap = module.exports.STDIDLTypeMap = {
  "DOMString": "std::string",
  "boolean" : "bool",
  "byte" : "int8_t",
  "octet" : "uint8_t",
  "short" : "int16_t",
  "unsigned short" : "uint16_t",
  "long" : "number",
  "unsigned long" : "uint32_t",
  "long long" : "int64_t",
  "unsigned long long" : "uint64_t",
  "float" : "float",
  "double" : "double"
};


module.exports.getContext = function(ast, moduleName){
  var context =  {
    that: ast,
    moduleName: moduleName,

    timestamp: ""+(new Date()),

    dictionaries: ast.getDictionaryArray(),

    callbacks: ast.getCallbackArray(),

    interfaces: ast.getInterfaceArray(),

    enums: ast.getEnumsArray(),

    test_code: ast.getTestCodeArray(),

    hasOperations: ast.get_hasOperations(),

    uses_strings: ast.uses_strings,
    has_callbacks: ast.has_callbacks,
    stubs_on_or_off: ast.stubs_on_or_off,

    array_types: ast.turn_object_into_array(ast.array_types),

    variadic_types: ast.turn_object_into_array(ast.variadic_types),

    uses_any_type: ast.uses_any_type,
    any_type_list: ast.get_any_type_list(),  

    sorted_types_list: ast.sorted_types_list,

    C_type_list: ast.get_C_type_list(),

    hasDictTypes: function(){
      return this.dictionaries.length > 0;
    },

    repress_stubs: ast.repress_stubs,

    typeIsSequence: function(){
      return this.idlType && this.idlType.sequence;
    },

    typeIsArray: function(){
      return this.idlType && this.idlType.array > 0;
    },

    STDTypeName: function(){
      var typeName = ast.getTypeName(this);
      if(ast.isDictionaryType(typeName)){
        // it's a dictionary, we don't need formatting.
        return typeName;
      } else if(ast.isPrimitiveType(typeName)){
        if(STDIDLTypeMap[typeName]){
          return STDIDLTypeMap[typeName];
        } else {
          // assume the idl primitive type is supported in std c++!
          return typeName;
        }
      } else {
        // it's something else.
        throw "Type case not handled: "+typeName;
      }
    },

    TypeWrapperName: function(){
      var typeName = ast.getTypeName(this);
      if(ast.isDictionaryType(typeName)){
        // it's a dictionary, we don't need formatting.
        return typeName;
      } else if(ast.isPrimitiveType(typeName)){
        // CamelCase it
        return typeName.replace(/(?:^\w|[A-Z]|\b\w)/g, function (l) {
          return l.toUpperCase();
        }).replace(/\s+/g, '');
      } else {
        // it's something else.
        throw "Type case not handled: "+typeName;
      }
    },

    is_enum: function() { return this.type === "enum" },
    is_interface: function() { return this.type === "interface" },
    is_dictionary: function() { return this.type === "dictionary" },
    is_callback: function() { return this.type === "callback" },
    Show_name: function() { return function(text) {
	                            return hogan.compile(text).render(this);};
			  },
    Show_name2: function() { return function(text)
			{
		            var modulename = hogan.compile(text).render(this);
			    return "MODULENAME = " + modulename;
                        };
			   },
    needsArrayDeclaration: function() { return function(text)
		        {
			    var type_name = hogan.compile(text).render(this);
			    if (that.array_types[type_name] != undefined)
				return true;
			    else
				return false;
			};
				      },

    ThrowsRPCErrorParamTypeString: function(){
      // pre: context: this is an operation
      var typeName = "pprpc::RPCError&";
      if(this.ThrowsRPCError){
        // it does indeed throw.
        if(this.arguments.length == 0){
          // there werent any previous arguments.
          return typeName;
        } else {
          // there were previous arguments
          return ", "+typeName;
        }
      }
    },

    ThrowsRPCErrorParamString: function(){
      // pre: context: this is an operation
      var typeName = "error";
      if(this.ThrowsRPCError){
        // it does indeed throw.
        if(this.arguments.length == 0){
          // there werent any previous arguments.
          return typeName;
        } else {
          // there were previous arguments
          return ", "+typeName;
        }
      }
    }


  };

  return _.assign(context, {
    // functions that depend on previous functions.

    STDTypeString: function(){
      var stdTypeName = context.STDTypeName.apply(this);
      if(context.typeIsSequence.apply(this)){
	  return "std::vector<"+stdTypeName+">";
      } else if(context.typeIsArray.apply(this)){
	  return stdTypeName+"*";
      } else {
	  // normal
	  return stdTypeName;
      }
    } /* STDTypeString */
  });
};

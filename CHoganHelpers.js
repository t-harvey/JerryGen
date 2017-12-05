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

    utilities_filename: ast.utilities_filename,

    timestamp: ""+(new Date()),

    dictionaries: ast.getDictionaryArray(),

    callbacks: ast.getCallbackArray(),

    interfaces: ast.getInterfaceArray(),

    enums: ast.getEnumsArray(),

    debug_printing: ast.debug_printing,

    array_types: ast.turn_object_into_array(ast.array_types),

    variadic_types: ast.turn_object_into_array(ast.variadic_types),

    externalTypes: ast.getExternalTypesArray(),

    is_module: ast.is_module,

    uses_any_type: ast.uses_any_type,
    any_type_list: ast.get_any_type_list(),  

    sorted_types_list: ast.sorted_types_list,

    C_type_list: ast.get_C_type_list(),

    repress_stubs: ast.repress_stubs,

    is_enum: function() { return this.type === "enum" },
    is_interface: function() { return this.type === "interface" },
    is_dictionary: function() { return this.type === "dictionary" },
    is_callback: function() { return this.type === "callback" },

  };

  return context;
};

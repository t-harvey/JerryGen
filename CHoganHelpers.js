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

    dictionaries: ast.turn_object_into_array(ast.dictionaries),

    typedefs: ast.turn_object_into_array(ast.typedefs),

    callbacks: ast.turn_object_into_array(ast.callbacks),

    interfaces: ast.turn_object_into_array(ast.interfaces),

    enums: ast.turn_object_into_array(ast.enums),

    composites: ast.turn_object_into_array(ast.composites),

    Interpreter: ast.Interpreter,

    debug_printing: ast.debug_printing,

    print_generation_message: ast.print_generation_message,

    array_types: ast.turn_object_into_array(ast.array_types),

    variadic_types: ast.turn_object_into_array(ast.variadic_types),

    externalTypes: ast.getExternalTypesArray(),

    prototype_chain: ast.prototype_chain,

    sorted_types_list: ast.sorted_types_list,

    repress_stubs: ast.repress_stubs,

    original_arg_handling: ast.original_arg_handling,

    is_enum: function() { return this.type === "enum" },
    is_interface: function() { return this.type === "interface" },
    is_dictionary: function() { return this.type === "dictionary" },
    is_callback: function() { return this.type === "callback" },

    debug_counter: 0,
    debug_print: function() { this.debug_counter++;
			      return function(text, render)
			      {
				  console.log(this.debug_counter + ":  " + text);
			      } ;
			    },

  };

  return context;
};

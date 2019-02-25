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

/* the code in this module actually calls the Hogan compiler, after
   using getContext to build the data structure that that compiler
   needs */

let fs = require('fs');
let hogan = require('hogan.js');
let _ = require('lodash');

let CHoganHelpers = require("./CHoganHelpers.js");


/* opens and reads the Mustache file */
function getMustacheTemplate(templateName){
    let mustache_filename = __dirname+"/c-templates/"+templateName+".mustache";
    return fs.readFileSync(mustache_filename, {encoding: 'utf8'})
} /* getMustacheTemplate */


/* writes into the context object the kind of file to be created */
let set_type_of_file = function(context, header_or_body)
{
    if (header_or_body === "generate_header")
	context.header = true;
    else if (header_or_body === "generate_private_header")
	context.private_header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;
} /* set_type_of_file */


/*
Interface Code generation
 */

module.exports.genInterfaceString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    let precompile_prologue =
	         hogan.compile(getMustacheTemplate('demarshal_args'));
    let demarshal_template =
	         precompile_prologue.render({thingName: "{{{operationName}}}"});
    let compiled_demarshal_template = hogan.compile(demarshal_template);

    let precompile_epilogue =
	         hogan.compile(getMustacheTemplate('clean_up_and_return'));
    let clean_up_template =
	         precompile_epilogue.render({thingName: "{{{operationName}}}"});
    let compiled_clean_up_template = hogan.compile(clean_up_template);

    return hogan.compile(getMustacheTemplate('interface')).render(
	               context,
		       {demarshal_args:      compiled_demarshal_template,
			clean_up_and_return: compiled_clean_up_template});
}; /* getInterfaceString */


/*
Dictionary Code generation
 */

module.exports.genDictionaryString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    return hogan.compile(getMustacheTemplate('dictionary')).render(context);
}; /* genDictionaryString */


/*
Typedef Code generation
 */

module.exports.genTypedefString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    return hogan.compile(getMustacheTemplate('typedef')).render(context);
}; /* getTypedefString */


/*
Enum Code generation
 */

module.exports.genEnumString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    return hogan.compile(getMustacheTemplate('enum')).render(context);
}; /* genEnumString */


/*
Callback Code generation
 */

module.exports.genCallbackString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    let precompile_prologue =
	         hogan.compile(getMustacheTemplate('demarshal_args'));
    let demarshal_template =
	         precompile_prologue.render({thingName: "{{{callbackName}}}"});
    let compiled_demarshal_template = hogan.compile(demarshal_template);

    let precompile_epilogue =
	         hogan.compile(getMustacheTemplate('clean_up_and_return'));
    let clean_up_template =
	         precompile_epilogue.render({thingName: "{{{callbackName}}}"});
    let compiled_clean_up_template = hogan.compile(clean_up_template);

    return hogan.compile(getMustacheTemplate('callback')).render(
	               context,
		       {demarshal_args:      compiled_demarshal_template,
			clean_up_and_return: compiled_clean_up_template});
}; /* genCallbackString */


/*
Dictionary Code generation
 */

module.exports.genDictionaryTypesString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    return hogan.compile(getMustacheTemplate("types")).render(context);
}; /* genDictionaryTypesString */



/*
Composite-type Code generation
 */

module.exports.genCompositeString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);
    
    let precompile = hogan.compile(
	                 getMustacheTemplate('build_composite_arg_function'));
    let composite_template = precompile.render(
	                                 {thingName: "{{{compositeName}}}",
					  thingType: "Composite"});
    let compiled_template = hogan.compile(composite_template);

	return hogan.compile(getMustacheTemplate("composites")).render(context, {build_composite_arg_function: compiled_template});
}; /* genCompositeString */



/*
Stubs Code generation
 */

module.exports.genStubsString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    set_type_of_file(context, header_or_body);

    return hogan.compile(getMustacheTemplate("stubs")).render(context);
}; /* genStubsString */


/*
Utilities Code generation
 */

module.exports.genUtilitiesString = function(ast, moduleName, header_or_body)
{
    let context = CHoganHelpers.getContext(ast, moduleName);

    /* there's no such thing as a private header for the utilities */
    set_type_of_file(context, header_or_body);

    let precompile = hogan.compile(
	                 getMustacheTemplate('build_composite_arg_function'));
    let any_template = precompile.render({thingName: "any",
					  thingType: "any"});
    let compiled_template = hogan.compile(any_template);

    /* to make the compiled_template work, we need to add to the context
       the data structure that the template expects: */
    context.arg_function = {j_to_c_type_list: [{ C_Type: "string",
						webidl_name: "string",
						last_in_list: false
                                               },
	                                       { C_Type: "double",
						webidl_name: "double",
						last_in_list: false
                                               },
	                                       { C_Type: "bool",
						webidl_name: "boolean",
						last_in_list: true
                                               },
					      ]
			   };
    return hogan.compile(getMustacheTemplate("utilities")).render(context,
			{build_composite_arg_function: compiled_template});
}; /* genUtilitiesString */


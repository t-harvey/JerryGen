#!/usr/bin/env node
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

/* set up the packages we'll use */
var parser = require('webidl2'),
    qfs = require('q-io/fs'),
    reader = require('./IDLReader'),
    AugmentedAST = require('./AugmentedAST'),
    cwd = process.cwd(),
    parameters = require("./parameters.js"),
    generate = require("./file_generators.js");

try {

/* parse command-line arguments; throws an exception if there's an error */
parameters.validate();

// create an ast and filter it for subsequent processing w/ Hogan/Mustache
var parsed_file = (parser.parse(reader.readFiles(parameters.files)));
var augAST = new AugmentedAST(parsed_file,
			      parameters.fix_type_errors, parameters.package);

augAST.utilities_filename = "webidl_compiler_utilities";
augAST.debug_printing     = (parameters.debug_printing === "on");

// NOTE: THIS COMMENT WAS IN THE ORIGINAL CODE; IT SEEMS LIKE A GOOD IDEA(?)
// TODO, use cross-platform paths (using '/' is bad...)

// create a module folder named with the value in the variable "package"
var packagePath = cwd + "/" + parameters.package;
if (!parameters.quiet)
    console.log("Creating directory... (" + packagePath + ")");
qfs.makeDirectory(packagePath);
parameters.packagePath = packagePath;

/* generate all of the various .c and .h files */
generate.interfaces(augAST, parameters);
generate.stubs(augAST, parameters); /* stubs don't get overwritten, so if the
				     file already exists, this is a null step */
generate.dictionaries(augAST, parameters);
generate.enums(augAST, parameters);
generate.callbacks(augAST, parameters);
generate.composites(augAST, parameters);
if (parameters.output_utility_files)
    generate.utilities(augAST, parameters);

} /* end of try */  /* (end of script) */



catch(error_code)
{
    /* unpredictable errors come in (hopefully!) as a string explaining
       what went wrong */
    if (typeof error_code == 'string')
    {
	console.log("ERROR: >" + error_code + "<");
    }
    else if (error_code.message ==
	     parameters.error_codes.neither_package_nor_files_given)
    {
        console.log("ERROR: you must supply a package name and .idl file(s).");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.no_package_name_given)
    {
	console.log("ERROR: You must give a name with the --package=<name> command-line argument.  This will become the name of the directory into which the files are written, and the include file will be called <name>_Types.h.");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.no_filenames_given)
    {
	console.log("ERROR: You must give one or more .idl files to compile.");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.incorrect_parameter_value
	     ||
	     error_code.message == parameters.error_codes.need_help)
    {
        parameters.print_usage_message();
    }
    /* TODO: make actual error codes from AugmentedAST */
    else if (error_code.message==AugmentedAST.error_codes.external_inheritance)
    {
	console.log("ERROR: the interface \"" + error_code.parent_name + "\" has to be included in this file for the object \"" + error_code.object_name + "\" to inherit from it.");
    }
    else if (error_code.message == AugmentedAST.error_codes.duplicate_names)
    {
	var messages = error_code.messages;
	var verb = (messages.length === 1)?"is":"are";

	var plural = (parameters.files.length > 1)?"s":"";
	console.log("ERROR: duplicate names in the input file" + plural + ":");
	for(var i = 0; i < messages.length; i++)
	    console.log("\t" + messages[i]);
    }
    else
    {
	if (error_code.message === undefined)
	    console.log("ERROR: Unknown error.");
	else
	{
	    if (error_code.line === undefined)
		console.log("ERROR: Unknown error: >" + error_code.message + "<");
	    else
		/* if it has both .line and .message fields, it's likely
		   a parser error code */
		console.log("ERROR: Parser error: >" + error_code.message +
			    "< at line: " + error_code.line);
	}
    }
    process.exit(1);
} /* try-catch block */

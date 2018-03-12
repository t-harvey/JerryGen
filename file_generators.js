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

/* this code has all of the external calls to create .h and .c files for
   WebIDL constructs (dictionaries, interfaces, enums, and callbacks) */


let Generator = require('./Generator'),
    Q = require('q'),
    fileExists = require('file-exists'),
    qfs = require('q-io/fs');

module.exports = {

    /* we do almost the exact same thing when generating C files for the
       various WebIDL constructs, which is abstracted in this function...
       b/c of the way Javascript i/o works, we need to call the Hogan
       compiler for each file we create; since each file comes from a single
       WebIDL thing (and "things" are stored in lists in the AST), we chop off
       the list of objects and then successively stick a single one back
       onto the AST and call the Hogan compiler; (stubs take a little extra
       finagling, but are otherwise the same) */
    generate_C_files: function(augAST, parameters, object_type, compiler)
    {
	let compiling_stubs = false;
	if (object_type === "stubs")
	{
	    compiling_stubs = true;
	    /* we need to compile a stubs file for each interfaces, so
	       that's what we'll really iterate through... */
	    object_type = "interfaces";
	}

	let object_list = augAST[object_type]; // store off the object list
	var returned = [];

	for(let object_name in object_list)
	{
	    augAST[object_type] = {}; // not strictly necessary...
	    augAST[object_type] = 
		        {[object_name] : object_list[object_name]};

	    let header_or_body =     ["generate_header", "generate_body"];
	    let filename_extension = [      ".h"       ,      ".c"      ];

	    /* this loop handles creating both the .h and .c files -- the
	       Hogan scripts are set up to take the "header_or_body" value
	       to create one or the other */
	    for (var index = 0; index < 2; index++)
	    {
		let kind_of_file = header_or_body[index];
		let extension = filename_extension[index];
		
		/* call the compiler, and get back a "string", which is
		   the output of the call to the compiler */
		let CFileString = compiler(augAST,
					   parameters.package,
					   kind_of_file);

		let stubs_piece = (compiling_stubs)? "_stubs":"";
		let CFileFileName = parameters.packagePath + "/" +
		                                   object_name + stubs_piece +
		                                   extension;

		/* we don't want to overwrite stubs files, so we have to
		   do some extra checks... */
		/* note that writing a file returns
		   a promise, which we'll satisfy at the end of this function */
		if (!compiling_stubs)
		{
		    if (!parameters.quiet)
			console.log("Creating C File... (" + CFileFileName + ")");
		    returned.push(qfs.write(CFileFileName, CFileString));
		}
		else /* writing stubs files */
		{
		    if (fileExists.sync(CFileFileName) &&
			parameters.stubs != 'overwrite')
		    {
			if (!parameters.quiet)
			    console.log(">"+
					CFileFileName +
					"< exists; nothing written.");
		    }
		    else
		    {
			if (!parameters.quiet)
			    console.log("Creating C Stubs File: >" +
					CFileFileName +    "<");
			returned.push(qfs.write(CFileFileName, CFileString));
		    }
		}
	    }
	}

	augAST[object_type] = object_list; // put back the list of objects

	return Q.all(returned);
    }, /* generate_C_files */


    interfaces: function(augAST, parameters)
    {
	augAST.repress_stubs = (parameters.stubs === "off");
	this.generate_C_files(augAST, parameters, "interfaces",
			      Generator.genCString);
    } /* interfaces */,

    
    dictionaries: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "dictionaries",
			      Generator.genDictionaryString);
    } /* dictionaries */,
    

    enums: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "enums",
			      Generator.genEnumString);
    } /* enums */,

    
    callbacks: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "callbacks",
			      Generator.genCallbackString);
    }, /* callbacks */

    
    stubs: function(augAST, parameters)
    {
	if (parameters.stubs === 'off')
	    return;

	this.generate_C_files(augAST, parameters, "stubs",
			      Generator.genStubsString);
    } /* stubs */,


    utilities: function(augAST, parameters)
    {
	var write_return_value;
	var returned = [];

	let header_or_body = ["generate_header", "generate_body"];
	let filename_extension = [".h", ".c"];

	for (let index = 0; index < 2; index++)
	{
	    let kind_of_file = header_or_body[index];
	    let extension = filename_extension[index];

	    let utilitiesfileString = Generator.genUtilitiesString(augAST,
							    parameters.package,
							    kind_of_file);
	    let utilitiesfileFileName = parameters.packagePath + "/" + 
		                        augAST.utilities_filename + extension;

	    if (!parameters.quiet)
		console.log("Creating C Utilities File: >"+
			                          utilitiesfileFileName + "<");
	    returned.push(qfs.write(utilitiesfileFileName,
				    utilitiesfileString));
	}
	return Q.all(returned);
    }, /* utilities */
    
} /* exports */

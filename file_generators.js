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
	/* the inner loop, below, handles creating both the .h and .c files --
	   the Hogan scripts are set up to take the "header_or_body" value
	   to create one kind or the other */
	let header_or_body = [ ["generate_header"        , ".h"        ],
			       ["generate_private_header", "_private.h"],
			       ["generate_body"          , ".c"        ] ];
	/* we have a couple of different combinations of header and
	   C files, so we take the above array and control which of
	   those kinds of files we're going to make with this array */
	let indices = [];
	if (object_type === "stubs") /* doesn't need a private .h file */
	    indices = [ 0, 2 ];
	else if (object_type === "typedefs")  /* only needs .h files */
	    indices = [ 0, 1 ];
	else
	    indices = [ 0, 1, 2 ];

	let compiling_stubs = false;
	if (object_type === "stubs")
	{
	    compiling_stubs = true;
	    /* we need to compile a stubs file for each interface, so
	       we'll actually be iterating through the interfaces list
	       to create the corresponding stubs files... */
	    object_type = "interfaces";
	}

	let object_list = augAST[object_type]; /* store a copy of the object
						  list, as explained below */
	var returned = [];

	for(let object_name in object_list)
	{
	    if (object_list[object_name].dont_print_this_thing_out)
		continue;

	    /* since each WebIDL construct creates its own .c/.h files and
	       our simplistic implementation is restricted to creating only
	       a single file at any time, we'll clear the list of objects
	       we're creating files for and then stick a single object
	       onto the list to process it */
	    augAST[object_type] = {}; // not strictly necessary...
	    augAST[object_type] = {[object_name] : object_list[object_name]};

	    for (var runner = 0; runner < indices.length; runner++)
	    {
		let index = indices[runner];
		let kind_of_file = header_or_body[index][0];
		let extension    = header_or_body[index][1];
		
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
			      Generator.genInterfaceString);
    } /* interfaces */,

    
    dictionaries: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "dictionaries",
			      Generator.genDictionaryString);
    } /* dictionaries */,

    typedefs: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "typedefs",
			      Generator.genTypedefString);
    } /* typedefs */,
    

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
    }, /* stubs */


    composites: function(augAST, parameters)
    {
	this.generate_C_files(augAST, parameters, "composites",
			      Generator.genCompositeString);
    }, /* composites */


    utilities: function(augAST, parameters)
    {
	var write_return_value;
	var returned = [];

	let header_or_body = [["generate_header"        , ".h"        ],
			      ["generate_private_header", "_private.h"],
			      ["generate_body"          , ".c"        ] ];

	for (let index = 0; index < header_or_body.length; index++)
	{
	    let kind_of_file = header_or_body[index][0];
	    let extension = header_or_body[index][1];

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

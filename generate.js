#!/usr/bin/env node

/* set up the packages we'll use */
var parser = require('webidl2'),
    qfs = require('q-io/fs'),
    fileExists = require('file-exists'),
    reader = require('./IDLReader'),
    AugmentedAST = require('./AugmentedAST'),
    Generator = require('./Generator'),
    Q = require('q'),
    cwd = process.cwd(),
    parameters = require("./parameters.js");

try {

/* parse command-line arguments */
parameters.validate();

global_print_usage_message = parameters.print_usage_message;

// create an ast and filter it for subsequent processing w/ Hogan/Mustache
var parsed_file = (parser.parse(reader.readFiles(parameters.files)));
var augAST = new AugmentedAST(parsed_file, parameters.fix_type_errors, parameters.package);

/* we need to have a single name for the utilities file that everyone uses */
let utilities_filename = "webidl_compiler_utilities";
augAST.utilities_filename = utilities_filename;

/* individual functions to generate each of the output files */


var generate_CFile = function(){
    var interfaces_object = augAST.interfaces; // excise the interfaces
    var write_return_value;

    augAST.repress_stubs = (parameters.stubs === "off");
    for(let interface_name in interfaces_object)
    {
	augAST.interfaces = {}; // not strictly necessary...
	augAST.interfaces = {[interface_name] : interfaces_object[interface_name]};
	let header_or_body = ["generate_header", "generate_body"];
	let filename_extension = [".h", ".c"];

	for (let index = 0; index < 2; index++)
	{
	    let kind_of_file = header_or_body[index];
	    let extension = filename_extension[index];
    
            var CFileString = Generator.genCString(augAST, parameters.package,
						   kind_of_file);
            var CFileFileName = packagePath + "/" + interface_name + extension;
            console.log("Creating C File... ("+CFileFileName+")");
	    write_return_value = qfs.write(CFileFileName, CFileString);
	}
    }
    augAST.interfaces = interfaces_object; // put back the interfaces
    return write_return_value; // result of last qfs.write
}; /* generate_CFile */


var generate_dictionaries = function(){
    var dictionaries_object = augAST.dictionaries; // excise the dictionaries
    var write_return_value;

    augAST.repress_stubs = (parameters.stubs === "off");
    for(var dictionary_name in dictionaries_object)
    {
	augAST.dictionaries = {}; // not strictly necessary...
	augAST.dictionaries = {[dictionary_name] : dictionaries_object[dictionary_name]};
    
        var CFileString_header = Generator.genDictionaryString(augAST,
							    parameters.package,
							    "generate_header");
        var CFileFileName_header = packagePath + "/" + dictionary_name + ".h";
        var CFileString_body =  Generator.genDictionaryString(augAST,
							    parameters.package,
							    "generate_body");
        var CFileFileName_body = packagePath + "/" + dictionary_name + ".c";
        console.log("Creating C header file... ("+CFileFileName_header+")");
	write_return_value = qfs.write(CFileFileName_header, CFileString_header);
        console.log("Creating C body file... ("+CFileFileName_body+")");
	write_return_value = qfs.write(CFileFileName_body, CFileString_body);
    }
    augAST.dictionaries = dictionaries_object; // put back the dictionaries
    return write_return_value; // result of last qfs.write
}; /* generate_dictionaries */


var generate_callbacks = function(){
    var callbacks_object = augAST.callbacks; // excise the callbacks
    var write_return_value;

    for(var callback_name in callbacks_object)
    {
	augAST.callbacks = {}; // not strictly necessary...
	augAST.callbacks = {[callback_name] : callbacks_object[callback_name]};

	let header_or_body = ["generate_header", "generate_body"];
	let filename_extension = [".h", ".c"];

	for (let index = 0; index < 2; index++)
	{
	    let kind_of_file = header_or_body[index];
	    let extension = filename_extension[index];
    
            var callbackString =
		 Generator.genCallbackString(augAST, parameters.package,
					     kind_of_file);
            var callbackFilename = packagePath+"/"+callback_name+extension;

            console.log("Creating C file... ("+callbackFilename+")");
	    write_return_value = qfs.write(callbackFilename, callbackString);
	}
    }
    augAST.callbacks = callbacks_object; // put back the callbacks
    return write_return_value; // result of last qfs.write
}; /* generate_callbacks */


var generate_utility_files = function(){
    var returned = [];
    if(Object.keys(augAST.dictionaries).length > 0 ||
       Object.keys(augAST.interfaces).length > 0 ||
       Object.keys(augAST.callbacks).length > 0 ||
       Object.keys(augAST.enums).length > 0)
    {
        // we'll need to generate the types
        var headerFilename = packagePath + "/" + 
	                                       parameters.package + "_Types.h";
        var header_bodyFilename = packagePath + "/" +
	                                       parameters.package + "_Types.c";
        var headerString = Generator.genDictionaryTypesString(augAST,
							    parameters.package,
							    "generate_header");
        var header_bodyString = Generator.genDictionaryTypesString(augAST,
							    package,
						            "generate_body");
        console.log("Creating header file... (" + headerFilename + ")");
        returned.push(qfs.write(headerFilename, headerString));
        returned.push(qfs.write(header_bodyFilename, header_bodyString));
    }
    return Q.all(returned);
}; /* generate_utility_files */


var generate_utilities = function(){
    var write_return_value;
    var returned = [];

    let header_or_body = ["generate_header", "generate_body"];
    let filename_extension = [".h", ".c"];

    augAST.debug_printing = (parameters.debug_printing === "on");

    for (let index = 0; index < 2; index++)
    {
	let kind_of_file = header_or_body[index];
	let extension = filename_extension[index];

	let utilitiesfileString = Generator.genUtilitiesString(augAST,
							    parameters.package,
							    kind_of_file);
	let utilitiesfileFileName = packagePath + "/" + utilities_filename + extension;

	console.log("Creating C Utilities File: >"+utilitiesfileFileName+"<");
	returned.push(qfs.write(utilitiesfileFileName,
				utilitiesfileString));
    }
    return Q.all(returned);
} /* generate_utilities */


var generate_stubs = function(){
    var interfaces_object = augAST.interfaces; // excise the interfaces
    var write_return_value;
    var returned = [];

    augAST.debug_printing = (parameters.debug_printing === "on");
    if (parameters.stubs == 'off')
	return;

    for(var interface_name in interfaces_object)
    {
	augAST.interfaces = {}; // not strictly necessary...
	augAST.interfaces = {[interface_name] : interfaces_object[interface_name]};
	let header_or_body = ["generate_header", "generate_body"];
	let filename_extension = [".h", ".c"];

	for (let index = 0; index < 2; index++)
	{
	    let kind_of_file = header_or_body[index];
	    let extension = filename_extension[index];

	    let stubsfileString = Generator.genStubsString(augAST,
							   package,
							   kind_of_file);
	    let stubsfileFileName = packagePath + "/" + interface_name + "_stubs" + extension;

	    if (fileExists.sync(stubsfileFileName) &&
		parameters.stubs != 'overwrite')
		console.log(">"+stubsfileFileName+"< exists; nothing written.");
	    else
	    {
		console.log("Creating C Stubs File: >"+stubsfileFileName+"<");
		returned.push(qfs.write(stubsfileFileName,
					stubsfileString));
	    }
	}
    }
    augAST.interfaces = interfaces_object; // put back the interfaces
    return Q.all(returned);
} /* generate_stubs */


var report_done = function(){
        console.log("Done.");
}; /* report_done */


// NOTE: THIS COMMENT WAS IN THE ORIGINAL CODE; IT SEEMS LIKE A GOOD IDEA(?)
// todo, use cross-platform paths (using '/' is bad...)


// create a module folder named with the value in the variable "package"
var packagePath = cwd + "/" + parameters.package;
console.log("Creating directory... (" + packagePath + ")");
qfs.makeDirectory(packagePath);

generate_utilities();
generate_stubs(); /* stubs don't get overwritten, so if the file already
		     exists, this is a null step */
generate_CFile();
generate_dictionaries();
generate_callbacks();
if (parameters.output_utility_files)
    generate_utility_files();

report_done();

} /* end of try */  /* (end of script) */



catch(error_code)
{
    if (typeof error_code == 'string')
    {
	console.log("Error: >" + error_code + "<");
    }
    else if (error_code.message ==
	     parameters.error_codes.neither_package_nor_files_given)
    {
        console.log("Error: you must supply a package name and .idl file(s).");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.no_package_name_given)
    {
	console.log("You must give a name with the --package=<name> command-line argument.  This will become the name of the directory into which the files are written, and the include file will be called <name>_Types.h.");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.no_filenames_given)
    {
	console.log("You must give one or more .idl files to compile.");
        parameters.print_usage_message();
    }
    else if (error_code.message ==
	     parameters.error_codes.incorrect_parameter_value)
    {
        parameters.print_usage_message();
    }
    else
    {
	if (error_code.message === undefined)
	    console.log("Unknown error.");
	else
	{
	    if (error_code.line === undefined)
		console.log("Unknown error: >" + error_code.message + "<");
	    else
		/* if it has both .line and .message fields, it's likely
		   a parser error code */
		console.log("Parser error: >" + error_code.message + "< at line: " + error_code.line);
	}
    }
} /* try-catch block */

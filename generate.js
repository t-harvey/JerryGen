#!/usr/bin/env node

/* set up the packages we'll use */
var parser = require('webidl2'),
    qfs = require('q-io/fs'),
    fileExists = require('file-exists'),
    reader = require('./IDLReader'),
    AugmentedAST = require('./AugmentedAST'),
    Generator = require('./Generator'),
    Q = require('q'),
    cwd = process.cwd();

/* parse command-line arguments */
var argv = require('minimist')(process.argv.slice(2)),
    files = argv['_'],
    genPackage = argv['package'],
    stubs_on_or_off = argv['stubs'],
    fix_type_errors = argv['fix_type_errors'],
    debug_printing = argv['debug_printing'];

/* for now, just default fix_type_errors to true */
if (fix_type_errors === undefined)
    fix_type_errors = true;
if (stubs_on_or_off === undefined)
    stubs_on_or_off = "on";
if (debug_printing === undefined)
    debug_printing = "off";
    

/* we wrap a big try/catch block around all of the functionality to
   make sure the user has given us all of the correct parameters (the
   catch is at the very bottom of this script) */
try
{
    if (genPackage === undefined && files.length === 0)
	throw new Error(0);
    if (genPackage === undefined)
	throw new Error(1);
    else if (files.length === 0)
	throw new Error(2);

// create an ast and filter it for subsequent processing w/ Hogan/Mustache
var parsed_file = (parser.parse(reader.readFiles(files)));
var augAST = new AugmentedAST(parsed_file, fix_type_errors, genPackage);

/* we need to have a single name for the utilities file that everyone uses */
let utilities_filename = "webidl_compiler_utilities";
augAST.utilities_filename = utilities_filename;

/* individual functions to generate each of the output files */


var generate_CFile = function(){
    var interfaces_object = augAST.interfaces; // excise the interfaces
    var write_return_value;

    augAST.repress_stubs = (stubs_on_or_off === "off");
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
    
            var CFileString = Generator.genCString(augAST, genPackage, kind_of_file);
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

    augAST.repress_stubs = (stubs_on_or_off === "off");
    for(var dictionary_name in dictionaries_object)
    {
	augAST.dictionaries = {}; // not strictly necessary...
	augAST.dictionaries = {[dictionary_name] : dictionaries_object[dictionary_name]};
    
        var CFileString_header =
	   Generator.genDictionaryString(augAST, genPackage, "generate_header");
        var CFileFileName_header = packagePath + "/" + dictionary_name + ".h";
        var CFileString_body =
	   Generator.genDictionaryString(augAST, genPackage, "generate_body");
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
		 Generator.genCallbackString(augAST, genPackage, kind_of_file);
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
        var headerFilename = packagePath + "/" + genPackage + "_Types.h";
        var header_bodyFilename = packagePath + "/" + genPackage + "_Types.c";
        var headerString = Generator.genDictionaryTypesString(augAST, genPackage, "generate_header");
        var header_bodyString = Generator.genDictionaryTypesString(augAST, genPackage, "generate_body");
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

    augAST.debug_printing = (debug_printing === "on");

    for (let index = 0; index < 2; index++)
    {
	let kind_of_file = header_or_body[index];
	let extension = filename_extension[index];

	let utilitiesfileString = Generator.genUtilitiesString(augAST, genPackage, kind_of_file);
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

    augAST.debug_printing = (debug_printing === "on");
    if (stubs_on_or_off == 'off')
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

	    let stubsfileString = Generator.genStubsString(augAST, genPackage, kind_of_file);
	    let stubsfileFileName = packagePath + "/" + interface_name + "_stubs" + extension;

	    if (fileExists.sync(stubsfileFileName) &&
		stubs_on_or_off != 'overwrite')
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
};


// NOTE: THIS COMMENT WAS IN THE ORIGINAL CODE; IT SEEMS LIKE A GOOD IDEA(?)
// todo, use cross-platform paths (using '/' is bad...)


// create a module folder named with the value in the variable genPackage
var packagePath = cwd + "/" + genPackage;
console.log("Creating directory... (" + packagePath + ")");
qfs.makeDirectory(packagePath);

generate_utilities();
generate_stubs(); /* stubs don't get overwritten, so if the file already
		     exists, this is a null step */
generate_CFile();
generate_dictionaries();
generate_callbacks();
generate_utility_files();

report_done();

} /* end of try */  /* (end of script) */



catch(error_code)
{
    if (typeof error_code == 'string')
    {
	console.log("Error: >" + error_code + "<");
    }
    else if (error_code.message == '0')
    {
       /* getting the running script name code comes from:
	  http://tinyurl.com/o52j5ek */
       var path = require('path');
       var scriptName = path.basename(__filename);

       console.log("Usage: " + scriptName + " --package=<name> <.idl file(s)>");
    }
    else if (error_code.message === '1')
	console.log("You must give a name with the --package=<name> command-line argument.  This will become the name of the directory into which the files are written, and the include file will be called <name>_Types.h.");
    else if (error_code.message === '2')
	console.log("You must give one or more .idl files to compile.");
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

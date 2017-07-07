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
    fix_type_errors = argv['fix_type_errors'];

/* for now, just default fix_type_errors to true */
if (fix_type_errors === undefined)
    fix_type_errors = true;
if (stubs_on_or_off === undefined)
    stubs_on_or_off = "on";
    

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


/* individual functions to generate each of the output files */

var generate_js = function(){
        var jsString = Generator.genJSString(augAST, genPackage);
        var jsFileName = packagePath + "/" + genPackage + ".js";
        console.log("Creating JS File... ("+jsFileName+")");
        return qfs.write(jsFileName, jsString);
}; /* generate_js */

var generate_CFile = function(){
    var interfaces_object = augAST.interfaces; // excise the interfaces
    var write_return_value;

    augAST.repress_stubs = (stubs_on_or_off === "off");
    for(var interface_name in interfaces_object)
    {
	augAST.interfaces = {}; // not strictly necessary...
	augAST.interfaces = {[interface_name] : interfaces_object[interface_name]};
    
        var CFileString = Generator.genCString(augAST, genPackage);
        var CFileFileName = packagePath + "/" + interface_name + ".c";
        console.log("Creating C++ File... ("+CFileFileName+")");
	write_return_value = qfs.write(CFileFileName, CFileString);
    }
    augAST.interfaces = interfaces_object; // put back the interfaces
    return write_return_value; // result of last qfs.write
}; /* generate_CFile */

var generate_include_files = function(){
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
}; /* generate_include_files */


var generate_stubs = function(){
    var interfaces_object = augAST.interfaces; // excise the interfaces
    var write_return_value;
    var returned = [];

    if (stubs_on_or_off == 'off')
	return;

    for(var interface_name in interfaces_object)
    {
	augAST.interfaces = {}; // not strictly necessary...
	augAST.interfaces = {[interface_name] : interfaces_object[interface_name]};
	let stubsfileString = Generator.genStubsString(augAST, genPackage);
	let stubsfileFileName = packagePath + "/" + interface_name + "_stubs.c";

	if (fileExists.sync(stubsfileFileName) &&
	    stubs_on_or_off != 'overwrite')
	    console.log(">"+stubsfileFileName+"< exists; nothing written.");
	else
	{
            console.log("Creating C++ Stubs File: >"+stubsfileFileName+"<");
	    returned.push(qfs.write(stubsfileFileName,
				    stubsfileString));
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

generate_stubs(); /* stubs don't get overwritten, so if the file already
		     exists, this is a null step */
generate_CFile();
generate_include_files();

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

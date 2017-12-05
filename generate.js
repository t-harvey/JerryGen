#!/usr/bin/env node

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
} /* try-catch block */

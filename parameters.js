#!/usr/bin/env node

/* parse command-line arguments */
/* we use "process.argv.slice(2) b/c the first two params in argv are
   "node" and the name of the script (in that order) */
var argv = require('minimist')(process.argv.slice(2));
let parameters = {
    files:                argv['_'],
    package:              argv['package'],
    stubs:                argv['stubs'],
    fix_type_errors:      argv['fix_type_errors'],
    debug_printing:       argv['debug_printing'],
    output_utility_files: argv['output_utility_files'] };

/* these are the sets of values that are acceptable for each of the flags --
   we'll use this not only as instructions to the user if they give us
   something not on the list, but the first item in each list of values
   is the default, set just succeeding... */
let acceptable_inputs = {
    fix_type_errors:      ["true", "false"],
    stubs:                ["on", "off", "overwrite"],
    debug_printing:       ["on", "off"],
    output_utility_files: ["true", "false"]
}; /* acceptable_inputs */

/* give default values for undefined command-line parameters */
for (var i of Object.keys(acceptable_inputs))
    if (parameters[i] === undefined)
	parameters[i] = acceptable_inputs[i][0];


var error_codes = {
	neither_package_nor_files_given: 0,
	no_package_name_given: 1,
	no_filenames_given: 2,
	unknown_parameter: 3,
	incorrect_parameter_value: 4
    }; /* error codes */

/* for pretty printing the usage message, this seems to be the easiest
   way to line things up in columns: after each flag name, we'll print
   a substring of spaces, where the length of that substring corresponds
   to the difference between the lengths of the current flag and the
   longest flag */
let longest_flag_length = (function()
			   {
			       var longest_seen = 0;
                               for(var i of Object.keys(acceptable_inputs))
			       {
				   var x = i.toString().length;
				   if (x > longest_seen) longest_seen = x;
			       }
			       return longest_seen;
                           })();
let spaces = "                           ";

/***********************************************************/

module.exports = {
    print_usage_message: function()
    {
	/* getting the running script name code comes from:
	   http://tinyurl.com/o52j5ek */
	var path = require('path');
	var scriptName = path.basename(process.argv[1]);

	console.log("\nUsage: " + scriptName + " <options> --package=<name> <.idl file(s)>");
	console.log("Options:");
	for (var i of Object.keys(acceptable_inputs))
	{
	    /* console.log prints no space after the comma when printing out
	       the members of an array, so we first copy its output to a
	       string, run a regular expression over it, and then print
	       the now-pretty string */
            console.log("    " + i + "       " +
			spaces.substring(0,(longest_flag_length-
					    i.toString().length)) +
			"possible values: " +
			acceptable_inputs[i].toString().replace(/,/g, ", "));
	}
	console.log("Example:")
	console.log("    " + scriptName + " --stubs=on --package=foobar foo.idl bar.idl");
    } /* print_usage_mesage */,

    files:                parameters.files,
    package:              parameters.package,
    stubs:                parameters.stubs,
    fix_type_errors:      parameters.fix_type_errors,
    debug_printing:       parameters.debug_printing,
    output_utility_files: parameters.output_utility_files,

    error_codes: error_codes,

    validate: function()
    {
	/* now, validate the parameters */
	if (parameters.package === undefined && parameters.files.length === 0)
	    throw new Error(this.error_codes.neither_package_nor_files_given);
	if (parameters.package === undefined ||
	    parameters.package.length === 0)
	    throw new Error(this.error_codes.no_package_name_given);
	if (parameters.files.length === 0)
	    throw new Error(this.error_codes.no_filenames_given);
	
	
	/* make sure that the values the parameters _do_ have are valid */
	let found_an_error = false;
	for(var i of Object.keys(parameters))
	{
	    /* all of the input WebIDL files have to end in .idl */
	    if (i === "files")
	    {
		for(var j=0; j < parameters.files.length; j++)
		{
		    if (!parameters.files[j].endsWith(".idl"))
		    {
			console.log("The filename >" + parameters.files[j] + "< does not have the \"idl\" extension.");
			found_an_error = true;
		    }
		}
	    }
	    /* we're going to arbitrarily enforce the rule that the package name
	       cannot end in ".idl" -- this lets us catch the error case where
	       the user types "generate.js --package i1.idl i2.idl" -- here, they
	       forgot to add the package name, and the minimist parser thinks that
	       i1.idl is the package name, and we only process i2.idl; (this
	       happened with our first user, which is why this is here!) */
	    else if (i === "package")
	    {
		/* TODO: what if there are _two_ "package" specifications? */
		
		/* we've already handled the empty case, but it's possible that the
		   user forgot to give a value, and the command-line parser (minimist)
		   incorrectly assigned the successive parameter to
		   parameters.package -- I think(?) that such a value can only be a
		   WebIDL-file name, so check for the .idl extension and report
		   that this is an error */
		if (parameters.package.endsWith(".idl"))
		{
		    console.log("The package name must not end with the \"idl\" extension.");
		    found_an_error = true;
		}
	    }
	    else if (parameters[i] != undefined &&
		     acceptable_inputs[i].indexOf(parameters[i]) < 0)
	    {
		console.log("ERROR in parameter: " + i);
		console.log("    entered: " + parameters[i]);
		console.log("    possible values: " +
			 acceptable_inputs[i].toString().replace(/,/g, ", "));
		found_an_error = true;
	    }
	}
	/* make sure that there were no misspelled flags -- check all of the keys
	   in argv against the flags we expect to see...if there is an entry
	   that we didn't expect, assume it's a misspelling */
	for (var i of Object.keys(argv))
	{
	    /* first, knock out pieces of argv that aren't actually flags */
	    if (i === "_" || i === "package")
		continue;
	    
	    /* valid flags will have an entry in acceptable_inputs */
	    else if (!(i in acceptable_inputs))
	    {
		console.log("Unrecognized flag: >" + i + "<");
		found_an_error = true;
	    }
	}
	if (found_an_error)
	    throw new Error(this.error_codes.incorrect_parameter_value);
    } /* validate */
} /* end of export object */

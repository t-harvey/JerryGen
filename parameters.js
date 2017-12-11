#!/usr/bin/env node

/* parse command-line arguments */
/* we use "process.argv.slice(2) b/c the first two params in argv are
   "node" and the name of the script (in that order) */
let argv = require('minimist')(process.argv.slice(2));
let command_line_parms = {
    files:                argv['_'],
    package:              argv['package'],
    stubs:                argv['stubs'],
    fix_type_errors:      argv['fix_type_errors'],
    debug_printing:       argv['debug_printing'],
    output_utility_files: argv['output_utility_files'],
    quiet:                argv['quiet'],
    help:                 argv['help']
};

/* these are the sets of values that are acceptable for each of the flags --
   we'll use this not only as instructions to the user if they give us
   something not on the list, but the first item in each list of values
   is the default, which gets set just succeeding... */
let acceptable_inputs = {
    fix_type_errors:      [true, false],
    stubs:                ["on", "off", "overwrite"],
    debug_printing:       ["off", "on"],
    output_utility_files: [false, true],
    quiet:                [false, true],
    help:                 [false, true]
}; /* acceptable_inputs */

/* give default values for undefined command-line parameters */
for (var i of Object.keys(acceptable_inputs))
    if (command_line_parms[i] === undefined)
	command_line_parms[i] = acceptable_inputs[i][0];

/* any flag entered without an explicit value is considered to be a
   boolean (set to true), but explicit values are considered to be
   strings -- so "--help" gives "help" a boolean value, while "--help=true"
   set "help" to a string...  to get around this problem, we'll explicitly
   convert "true" (string) to true (boolean) and "false" to false */
for (var i of Object.keys(acceptable_inputs))
    if (command_line_parms[i] === "true")
	command_line_parms[i] = true;
    else if (command_line_parms[i] === "false")
	command_line_parms[i] = false;

/* when the flag is true/false, but the expected value is "on"/"off",
   convert to the string version */
/* CAUTION: ASSUMES "on" === true AND "off" === false !!! */
for (var i of Object.keys(acceptable_inputs))
    if (typeof command_line_parms[i] === "boolean" &&
	typeof acceptable_inputs[i][0] === "string")
    {
	if (command_line_parms[i] === true)
	    command_line_parms[i] = "on";
	else
	    command_line_parms[i] = "off";
    }

let error_codes = {
	neither_package_nor_files_given: 0,
	no_package_name_given: 1,
	no_filenames_given: 2,
	unknown_parameter: 3,
	incorrect_parameter_value: 4,
        need_help: 5
}; /* error codes */

/* for pretty printing the usage message, this seems to be the easiest
   way to line things up in columns: after each flag name, we'll print
   a substring of spaces, where the length of that substring corresponds
   to the difference between the lengths of the current flag and the
   longest flag */
let longest_flag_length = (function()
			   {
			       let longest_seen = 0;
                               for(var i of Object.keys(acceptable_inputs))
			       {
				   var x = i.toString().length;
				   if (x > longest_seen) longest_seen = x;
			       }
			       return longest_seen;
                           })();
let spaces = "                           ";

/***********************************************************/

/* we use Object.assign here so that we can just tack on command_line_parms
   to the exported object */
module.exports = Object.assign(
{
    print_usage_message: function()
    {
	/* getting the running script name code comes from:
	   http://tinyurl.com/o52j5ek */
	let path = require('path');
	let scriptName = path.basename(process.argv[1]);

	console.log("\nUsage: " + scriptName +
		    " <options> --package=<name> <.idl file(s)>");
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
	console.log("    " + scriptName +
		    " --stubs=on --package=foobar foo.idl bar.idl");
    } /* print_usage_mesage */,

    error_codes: error_codes,

    /* after exporting, we may not be able to see "command_line_parms", so
       capture the field names */
    command_line_parms_keys: Object.keys(command_line_parms),

    validate: function()
    {
	if (this.help === true)
	    throw new Error(this.error_codes.need_help);

	/* now, validate the parameters */
	if (this.package === undefined && this.files.length === 0)
	    throw new Error(this.error_codes.neither_package_nor_files_given);
	if (this.package === undefined ||
	    this.package.length === 0)
	    throw new Error(this.error_codes.no_package_name_given);
	if (this.files.length === 0)
	    throw new Error(this.error_codes.no_filenames_given);
	
	
	/* make sure that the values the parameters _do_ have are valid */
	let found_an_error = false;
	for(var i of Object.keys(this.command_line_parms_keys))
	{
	    /* all of the input WebIDL files have to end in .idl */
	    if (i === "files")
	    {
		for(var j=0; j < this.files.length; j++)
		{
		    if (!this.files[j].endsWith(".idl"))
		    {
			console.log("ERROR: The filename >" + this.files[j] +
				    "< does not have the \"idl\" extension.");
			found_an_error = true;
		    }
		}
	    }
	    /* we're going to arbitrarily enforce the rule that the
	       package name cannot end in ".idl" -- this lets us catch
	       the error case where the user types "generate.js
	       --package i1.idl i2.idl" -- here, they forgot to add
	       the package name, and the minimist parser thinks that
	       i1.idl is the package name, and we only process i2.idl;
	       (this happened with our first user, which is why this
	       is here!) */
	    else if (i === "package")
	    {
		/* TODO: what if there are _two_ "package" specifications? */
		
		/* we've already handled the empty case, but it's
		   possible that the user forgot to give a value, and
		   the command-line parser (minimist) incorrectly
		   assigned the successive parameter to
		   this.package -- I think(?) that such a value
		   can only be a WebIDL-file name, so check for the
		   .idl extension and report that this is an error */
		if (this.package.endsWith(".idl"))
		{
		    console.log("ERROR: The package name must not end with the \"idl\" extension.");
		    found_an_error = true;
		}
	    }
	    else if (this[i] != undefined &&
		     acceptable_inputs[i].indexOf(this[i]) < 0)
	    {
		console.log("ERROR in parameter: " + i);
		console.log("    entered: " + this[i]);
		console.log("    possible values: " +
			 acceptable_inputs[i].toString().replace(/,/g, ", "));
		found_an_error = true;
	    }
	}
	/* make sure that there were no misspelled flags -- check all
	   of the keys in argv against the flags we expect to see...if
	   there is an entry that we didn't expect, assume it's a
	   misspelling */
	for (var i of Object.keys(argv))
	{
	    /* first, knock out pieces of argv that aren't actually flags */
	    if (i === "_" || i === "package")
		continue;
	    
	    /* valid flags will have an entry in acceptable_inputs */
	    else if (!(i in acceptable_inputs))
	    {
		console.log("ERROR: Unrecognized flag: >" + i + "<");
		found_an_error = true;
	    }
	}
	if (found_an_error)
	    throw new Error(this.error_codes.incorrect_parameter_value);
    } /* validate */
} ,

command_line_parms

)/* end of export object */

#! /usr/bin/env node
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

/* WHEN ADDING A NEW FLAG:
   You should only need to update the following two data structures:
   command_line_parms and acceptable_inputs
   (obviously, you then have to use your new flag elsewhere, but
    that should be the extent of changes in this file...)
*/

/* parse command-line arguments */
/* we use "process.argv.slice(2) b/c the first two params in argv are
   "node" and the name of the script (in that order) */
let argv = require('minimist')(process.argv.slice(2));
let command_line_parms = {
    files:                    argv['_'],
    include_files:            argv['include'],
    package:                  argv['package'],
    stubs:                    argv['stubs'],
    fix_type_errors:          argv['fix_type_errors'],
    debug_printing:           argv['debug_printing'],
    leave_enums_alone:        argv['leave_enums_alone'],
    print_generation_message: argv['print_generation_message'],
    output_utility_files:     argv['output_utility_files'],
    quiet:                    argv['quiet'],
    arg_handling:             argv['arg_handling'],
    tied_to_jerryscript:      argv['tied_to_jerryscript'],
    help:                     argv['help']
};

/* these are the sets of values that are acceptable for each of the flags --
   we'll use this not only as instructions to the user if they give us
   something not on the list, but the first item in each list of values
   is the default, which gets set just succeeding... */
let acceptable_inputs = {
    include:                  ["any filename ending with .idl"],
    fix_type_errors:          [true, false],
    stubs:                    ["preserve", "overwrite"],
    debug_printing:           ["off", "on"],
    output_utility_files:     [false, true],
    leave_enums_alone:        [false, true],
    print_generation_message: [true, false],
    quiet:                    [false, true],
    arg_handling:             ["original", "new"],
    tied_to_jerryscript:      [false, true],
    help:                     []
}; /* acceptable_inputs */

/* we define this during module definition so that we can pass to
   validate() that we found an error while doing simple parsing of
   parameters */
let found_an_error = false;

/* give default values for undefined command-line parameters */
for (var i of Object.keys(acceptable_inputs))
    if (command_line_parms[i] === undefined)
	command_line_parms[i] = acceptable_inputs[i][0];

/* if the user uses the same command-line parameter more than once,
   minimist returns an array of all of the values associated with
   those flags; if every value in the array is the same as the others,
   then we'll just clean up the array -- note that we have to equate
   "on" with "true" and "off" with "false"... */
let equal_values = function(x, y)
{
    let true_value = function(x)
    {
	return (x === "true"      || x === "on" ||
		x === "overwrite" || (typeof x === "boolean" && x));
    }; /* true_value */
    let false_value = function(x)
    {
        return (x === "false" || x === "off" ||
		(typeof x === "boolean" && !x));
    }; /* false_value */

    return ((true_value(x) && true_value(y))   ||
	    (false_value(x) && false_value(y)) ||
	    x === y);
}; /* equal_values */

/* a little bit of fuzzy logic, here: minimist sometimes takes on a
   successive parameter for a flag if the flag isn't of the form:
   --<flag>=value, instead parsing it as: --<flag> value (the intent
   being to set <flag> to its non-default value (b/c why else would
   you include it on the command line?!?), but with minimist assigning
   "value" to <flag>); in our tests, we would sometimes see the .idl
   file following one of these shorthand flags, and we'd report an
   error when there really isn't one -- so see if we can find these
   examples and move the .idl filename to its appropriate spot */
for (let i of Object.keys(acceptable_inputs))
{
    if (i === "include" || i === "help")
	continue;
    else if (Array.isArray(command_line_parms[i]))
    {
	let array_of_values = command_line_parms[i];
	for (let j = 0; j < array_of_values.length; j++)
	    if (typeof array_of_values[j] === "string" &&
		array_of_values[j].endsWith(".idl"))
	    {
		let idl_filename = array_of_values.splice(j, 1)[0];
		command_line_parms["files"].push(idl_filename);
		j--; /* this offsets the loop increment, since we
			just shortened the array */
	    }
	if (array_of_values.length === 0)
	    command_line_parms[i] = acceptable_inputs[i][1];
    }
    else if (typeof command_line_parms[i] === "string" &&
	     command_line_parms[i].endsWith(".idl"))
    {
	command_line_parms["files"].push(command_line_parms[i]);
	command_line_parms[i] = acceptable_inputs[i][1];
    }
}

for (let i of Object.keys(acceptable_inputs))
    if (i === "include" || i === "help")
	continue;
    else if (Array.isArray(command_line_parms[i]))
    {
	let array_of_values = command_line_parms[i];
	let first_value = array_of_values[0];
	let found_inconsistency = false;
	for (let j = 1; j < array_of_values.length; j++)
	    if (!equal_values(first_value, array_of_values[j]))
	    {
		console.log("ERROR: The flag \"" + i + "\" was entered more than once with different values.");
		found_an_error = true;
		found_inconsistency = true;
	    }
	if (!found_inconsistency)
	    command_line_parms[i] = first_value;
    }

/* if there's only one include file, it comes in as a string, while
   if there are more than one, the strings for each will be in an
   array; for ease, just always make this an array */
if (typeof command_line_parms["include_files"] === "string")
    command_line_parms["include_files"] = [ command_line_parms["include_files"] ];

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
	let hidden_parameters = [ "arg_handling", "tied_to_jerryscript" ];

	console.log("\nUsage: " + scriptName +
		    " <options> --package=<name> <.idl file(s)>");
	console.log("Options:");
	for (var i of Object.keys(acceptable_inputs))
	{
	    if (hidden_parameters.includes(i))
		continue;

	    /* console.log prints no space after the comma when printing out
	       the members of an array, so we first copy its output to a
	       string, run a regular expression over it, and then print
	       the now-pretty string */
	    /* also, only print the possible values if there _are_ any */
	    var possible_values_string = (acceptable_inputs[i].length > 0)?
		"possible values: " +
			   acceptable_inputs[i].toString().replace(/,/g, ", "):
		"";

	    console.log("    " + i + "       " +
			spaces.substring(0,(longest_flag_length-
					    i.toString().length)) +
			possible_values_string);
	}
	console.log("Example:")
	console.log("    " + scriptName +
		    " --stubs=overwrite --package=foobar foo.idl bar.idl");
    } /* print_usage_mesage */,

    error_codes: error_codes,

    /* after exporting, we may not be able to see "command_line_parms", so
       capture the field names */
    command_line_parms_keys: Object.keys(command_line_parms),

    validate: function()
    {
	let ensure_all_files_have_idl_as_an_extension = function(filename_list,
								 include_files)
	{
	    let kind_of_file = (include_files == true)?"include filename":"filename";
	    for(var j=0; j < filename_list.length; j++)
		{
		    if (!filename_list[j].endsWith(".idl"))
		    {
			console.log("ERROR: The " + kind_of_file +
				    " >" + filename_list[j] +
				    "< does not have the \"idl\" extension.");
			found_an_error = true;
		    }
		}
	} /* ensure_all_files_have_idl_as_an_extension */

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
	for (var i of this.command_line_parms_keys)
	{
	    /* all of the input WebIDL files have to end in .idl */
	    if (i === "files")
		ensure_all_files_have_idl_as_an_extension(this.files, false);
	    else if (i === "include_files" && typeof this.include_files != "undefined")
		ensure_all_files_have_idl_as_an_extension(this.include_files, true);

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
	    if (i === "_" || i === "package" || i === "include")
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

command_line_parms,
found_an_error

)/* end of export object */

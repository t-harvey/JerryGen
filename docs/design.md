# Design of the generator

<code>TODO</code>, an aside:<br>
The code is sprinkled with comments that start with
<code>TODO</code> -- these represent places that (may) need further
development.

The <code>generator</code> directory contains the main driver for the
code, <code>generator.js</code>, a Javascript script that takes the
parameters (<code>parameters.js</code>), calls the WebIDL parser on
the input files, invokes the main compiler
(<code>AugmentedAST.js</code>), and then calls the Hogan compiler to
parse the templates in the <code>c-templates</code> directory and
output the C code.

Many of the tools (like Hogan and the WebIDL parser) come straight
from the web-developing community , so the entire organization of
JerryGen reflects that approach.  Further, the original version of
this code came from a GitHub project called <code>native-calls</code>,
which was a masters-thesis project by an English student named Mohamed
Eltuhamy.  The structure of his code has largely continued into the
current implementation.

#### <code>generate.js</code>

The main routine of the JerryGen compiler is short/sweet: it
initializes the main packages, parses the file, compiles it into a
form that can be fed to Hogan, and then outputs the code (through Hogan).

#### <code>parameters.js</code>

This code gathers the parameters from the command line and checks them
for correctness.

#### <code>AugmentedAST.js</code>

This is the body of the compiler -- it (essentially) builds a symbol
table and type checks all of the WebIDL.

A perhaps unexpected function of this code is to provide the
control-flow information that Mustache does not have.  For example, in
a list of function parameters, the Mustache code puts out a comma
separator following all parameters except the last, and both the first
and last parameters need to be marked in order to put out the
surrounding parentheses.  The AugmentedAST code marks the first and
last parameters in every argument list, and the Mustache code looks
something like:<p>

<code>{{#arguments}}</code><br>
<code>    {{#first_in_list}}({{/first_in_list}}{{{parameter}}}{{^last_in_list}}, {{/last_in_list}}{{#last_in_list}}){{/last_in_list}}</code><br>
<code>{{/arguments}}</code>
</code>

#### <code>file_generators.js</code>

For each type, as many as five C files are created.  This code uses
the code in <code>Generator.js</code> to
build the specific data structure for each type of <code>WebIDL</code> construct and then
calls the Hogan compiler to build the appropriate files.

#### <code>Generator.js</code>

The code in this module gathers/builds the specific information for
each <code>WebIDL</code> construct that will be needed by the Hogan compiler and
then calls that compiler to build a string that can be written out
by the code in <code>file_generators.js</code>.

#### <code>CHoganHelpers.js</code>

This provides the <code>getContext</code> function used by the
<code>Generator</code> code.  The <code>getContext</code> function packages up
the Hogan compiler with all of the data structures created by
<code>AugmentedAST</code>.


# Testing

The original milestone for the JerryGen project was to correctly parse
and build code for the <code>WebIDL</code> in the
<code>zephyr.js</code> project, which is a Linaro-based project with
goals similar to our own: to support scripting on embedded processors.

During development, we also defined a set of "unit tests" that were
designed specifically to test individual new features as we progressed
towards compiling the <code>zephyr.js</code> code.

# Design of the generator

<code>TODO</code>, an aside:<p>
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

### <code>generator.js</code>

The main routine of the JerryGen compiler is short/sweet: it
initializes the main packages, parses the file, compiles it into a
form for Hogan, and then outputs the code (through Hogan).

### <code>parameters.js</code>

This code gathers the parameters from the command line and checks them
for correctness.

### <code>AugmentedAST.js</code>

This is the body of the compiler -- it (essentially) builds a symbol
table and type checks all of the WebIDL.

### <code>file_generators.js</code>

For each type, as many as five C files are created.  This code handles
building the data structure for each target file before handing the
data off to the Hogan parser.

### <code>CHoganHelpers.js</code>

This provides the <code>getContext</code> function, which packages up
the Hogan compiler with all of the data structures created by <code>AugmentedAST</code>.

# Testing

The original milestone for the JerryGen project was to correctly parse
and build code for the WebIDL in the <code>zephyr.js</code> project,
which is a Linaro-based project with goals similar to our own: to
support scripting on embedded processors.

During development, we also defined a set of "unit tests" that were
designed specifically to test individual new features as we progressed
towards compiling the <code>zephyr.js</code> code.

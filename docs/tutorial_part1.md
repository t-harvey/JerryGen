<span id="title-text"> Scripting : Using JerryGen, the WebIDL Compiler </span>
==============================================================================

 The JerryGen compiler takes WebIDL as input and produces C code.  The
compiler has two goals: to write "glue code" that utilizes the
Jerryscript C API and to provide "stubs" of C code that can be inserted
into the glue code and so provide Javascript programmers using the
Jerryscript interpreter with functionality from existing C code.

This document will explain some of the fundamentals of using the
compiler, including building C code from a WebIDL file, augmenting the
output of the compiler with human-generated C code, and building a
version of the Jerryscript interpreter that includes the C code.

WebIDL
------

WebIDL is a specification language – WebIDL files describe APIs, but
they do not implement code.

A WebIDL file is a simple text file with any number of WebIDL
"constructs" – i.e., types – that define an API.

Both the syntax and type system of WebIDL look like C, although the
built-in types largely have different names.  Table 1 shows the mapping
of WebIDL types to C types.

|             |         |          |          |                |          |               |           |                    |       |        |         |         |
|:-----------:|:-------:|----------|----------|----------------|----------|---------------|-----------|--------------------|-------|--------|---------|---------|
| WebIDL Type |   byte  | octet    | short    | unsigned short | long     | unsigned long | long long | unsigned long long | float | double | boolean | string  |
|    C Type   | int8\_t | uint8\_t | int16\_t | uint16\_t      | int32\_t | uint32\_t     | int64\_t  | uint64\_t          | float | double | bool    | char \* |

| WebIDL type        | C Type    |
|--------------------|-----------|
| byte               | int8\_t   |
| octet              | uint8\_t  |
| short              | int16\_t  |
| unsigned short     | uint16\_t |
| long               | int32\_t  |
| unsigned long      | uint32\_t |
| long long          | int64\_t  |
| unsigned long long | uint64\_t |
| float              | float     |
| double             | double    |
| bool               | boolean   |
| string             | char \*   |



The compiler supports only a subset of WebIDL – the four constructs that
we support are: enumeration types, callbacks, dictionaries, and
interfaces.

#### Enumeration types

Enumeration types in WebIDL are just sets of strings.  The syntax for
enumeration types is as follows:

``` syntaxhighlighter-pre
enum identifier { "enum", "values" /* , ... */ };
```

#### Callbacks

Callbacks can be thought of as function-type specifiers; the syntax for
callbacks is as follows:

``` syntaxhighlighter-pre
callback identifier = return_type (/* arguments... */);
```

#### Dictionaries

Dictionaries are equivalent to C structs.  The syntax for dictionaries
is:

``` syntaxhighlighter-pre
dictionary identifier {
  /* dictionary_members... */
};
```

#### Interfaces

Interfaces are equivalent to structs in C++; they contain "attributes",
which are equivalent to structure fields, and "operations", which are
equivalent to methods.  The syntax for interfaces is as follows:

``` syntaxhighlighter-pre
interface identifier {
    attribute long x;
    double foo(string y, boolean z);
  /* ...etc. */
};
```

#### Example

As a running example to show how all of the pieces fit together, we will
build a WebIDL file for a calculator.  The calculator will support four
functions, described by an enumeration type:

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };
```

The calculator will be defined by an interface with a an attribute to
control the precision of the output and a single operation:

``` syntaxhighlighter-pre
interface Calculator {
    attribute long digits_of_precision;
    float calculate( Calculator_Function function, float arg1, float arg2 );
};
```

...to use this WebIDL file, we'll have to build the compiler and
interpreter...

Building the compiler
---------------------

<span class="inline-comment-marker"
data-ref="2add9a68-a084-4d6e-a703-eec4bf49699b">First</span>, create a
directory in which to work and go there.  For the rest of the document,
we'll assume that the directory is called `~/JerryGen`.

 Now, clone the repo (historically, the compiler is referred to as the
"generator") :

``` syntaxhighlighter-pre
git clone https://github.com/t-harvey/JerryGen.git
```

...next, install the necessary Javascript modules:

``` syntaxhighlighter-pre
cd JerryGen
npm install
cd ..
```

...now, fork the Jerryscript repo ({{jerryscript-project/jerryscript}})
from GitHub:

``` syntaxhighlighter-pre
git clone https://github.com/jerryscript-project/jerryscript.git
```

...build the pieces of the interpreter:

``` syntaxhighlighter-pre
cd jerryscript
tools/build.py --debug --clean --verbose --lto=OFF
cd ..
```

...now, create a space to work and go there:

``` syntaxhighlighter-pre
mkdir working
cd working
```

Next, cut/paste the WebIDL constructs for our simple calculator into a
single file called "simple\_calculator.idl".  (We've shown the pieces
from the earlier example in this code block to make it easier)

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };


interface Calculator {
    attribute long digits_of_precision;
    float calculate( Calculator_Function function, float arg1, float arg2 );
};
```

Invoking the Compiler
---------------------

The compiler is a conglomeration of Javascript and Mustache code
initiated by the generator.js script.  Invoking the script (from
\~/JerryGen/working) with no parameters (or incorrect parameters) will
show the usage instructions:

``` syntaxhighlighter-pre
-> ../JerryGen/generate.js
ERROR: you must supply a package name and .idl file(s).

Usage: generate.js <options> --package=<name> <.idl file(s)>
Options:
include                        possible values: any filename ending with .idl
fix_type_errors                possible values: true, false
stubs                          possible values: preserve, overwrite
debug_printing                 possible values: off, on
output_utility_files           possible values: false, true
leave_enums_alone              possible values: false, true
print_generation_message       possible values: true, false
quiet                          possible values: false, true
help
Example:
    generate.js --stubs=overwrite --package=foobar foo.idl bar.idl
```

The generator produces many files from a single WebIDL file, as
explained in the next section.

The "package" parameter is the name of the directory that will be
created to put these files into; in addition to the actual WebIDL files,
this is the only required  parameter (and it must immediately precede
the list of WebIDL files (which must be last on the command line)).

The following table explains the remaining parameters.

<table style="width:100%;">
<colgroup>
<col style="width: 10%" />
<col style="width: 9%" />
<col style="width: 79%" />
</colgroup>
<thead>
<tr class="header">
<th>Parameter</th>
<th><p>Values</p>
<p>(default surrounded by "*")</p></th>
<th>Explanation</th>
</tr>
</thead>
<tbody>
<tr class="even">
<td>include</td>
<td>filename ending in .idl</td>
<td>Controls the inclusion of other WebIDL files whose types are used
in the current compilation, but code will not be generated for these files.</td>
</tr>
<tr class="odd">
<td>fix_type_errors</td>
<td>*true*, false</td>
<td>Simple type errors are fixed; in particular, we found that many programmers left off the return type of operations, so we default to a type of "void" for those operations and print error messages telling the user what the compiler did.</td>
</tr>
<tr class="even">
<td>stubs</td>
<td>*preserve*, overwrite</td>
<td>Controls the creation of the *_stubs files, explained in the next
section. We default to preserving any existing stubs files in the
package directory, because the stubs contain human-generated
code. This can be changed with the "overwrite" value, which creates
new stubs files, overwriting any existing stubs files.</td>
</tr>
<tr class="odd">
<td>debug_printing</td>
<td>*off*, on</td>
<td>When set to "on", the compiler will produce debug_print_* functions for every type, and each operation will print out the passed-in values of its parameters.</td>
</tr>
<tr class="even">
<td>output_utility_files</td>
<td>*false*, true</td>
<td>All of the code produced by the compiler relies on a library of utility functions. Instead of storing this file in some arbitrary directory, the user can have the compiler write out the utilities whenever/whereever he needs.</td>
</tr>
<tr class="odd">
<td>leave_enums_alone</td>
<td>*false*, true</td>
<td>Because C puts all enum values in the global namespace, it is easy
to have two enum names in separate enum types conflict -- e.g., the
enum1 and enum2 types might both have a value "foo", which is valid in
WebIDL and Javascript (b/c enums are strings in those languages), but
would cause a compiler error when translated as C enums.  To make the
general case easier, we prefix all enum values with their type name,
so that, in the example just given, the C enum values would be
```enum1_foo``` and ```enum2_foo```.  Giving the "true" value for this
parameter causes JerryGen to forgo adding the prefix.</td>
</tr>
<tr class="even">
<td>print_generation_message</td>
<td>*true*, false</td>
<td>By default, each file that gets generated has a date/time marker.
Setting this variable to false restricts the compiler from adding this
information.</td>
</tr>
<tr class="odd">
<td>quiet</td>
<td>*false*, true</td>
<td>Normally, the compiler shows the list of files created; setting this value to "true" will inhibit all but error messages.</td>
</tr>
<tr class="even">
<td>help</td>
<td><br />
</td>
<td>Print out the usage message (above).</td>
</tr>
</tbody>
</table>

For our example, invoke the compiler as follows:

``` syntaxhighlighter-pre
../JerryGen/generate.js --output_utility_files --package=simple_calculator simple_calculator.idl
```

...the output should be a listing of the files the compiler <span
class="inline-comment-marker"
data-ref="28098fa2-6f98-43da-988a-c3e44b03b8ed">created</span>:

``` syntaxhighlighter-pre
Creating directory... (/Users/CoolDude/work/examples/simple_calculator)
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator.h)
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator_private.h)
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator.c)
Creating C Stubs File: >/Users/CoolDude/work/examples/simple_calculator/Calculator_stubs.h<
Creating C Stubs File: >/Users/CoolDude/work/examples/simple_calculator/Calculator_stubs.c<
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator_Function.h)
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator_Function_private.h)
Creating C File... (/Users/CoolDude/work/examples/simple_calculator/Calculator_Function.c)
Creating C Utilities File: >/Users/CoolDude/work/examples/simple_calculator/webidl_compiler_utilities.h<
Creating C Utilities File: >/Users/CoolDude/work/examples/simple_calculator/webidl_compiler_utilities_private.h<
Creating C Utilities File: >/Users/CoolDude/work/examples/simple_calculator/webidl_compiler_utilities.c<
```

...the next section explains these files.

Files produced by the generator for our simple calculator
---------------------------------------------------------

The compiler produces three C files for each WebIDL construct, a public
header file (aka .h file), a private header file (indicated with the
suffix "\_private.h"), and a supporting code file (aka .c file).  The
public header files describe the C data structures and calls associated
with the construct.  The private header files and code files implement
the glue code for the interpreter and need not be examined.  The file
names are derived from the name of the construct.

Every type, both intrinsic types like float and long, as well as
user-defined types from each WebIDL file, has a `<type_name>_uid`
value – this should be considered a read-only value, although the user
will need to use it for composite types (see the section on composite
types for more).

Below, we'll look at what's important in the .h files created for our
calculator example.

#### Enumeration Types

Each .h file for an enumeration type contains the enumeration type
itself.  Everything else in the file should be ignored.

#### Interfaces

Interfaces are objects, made up of attributes and operations – the
attributes correspond to object fields, and the operations are methods.
 The .h file created for an interface will contain a struct of fields
and function pointers, much like callbacks.  In our example, the
Calculator.h file contains the Calculator struct.

Operations are the functionality that needs to be built by a human.  To
facilitate this, each interface produces not only a .c/.h pair, but also
a pair of .c/.h files that contain the "stubs", where a "stub" is,
essentially, an empty function that looks like the operation defined in
the WebIDL file.

#### Filling the stubs

NOTE: ignore the "`Native_Object`" code for now; that functionality will
be explained, below.

There is only one operation for the `Calculator` interface.  The name
of the operation's stub is derived from the interface name and
operation name, so the function that we'll edit is named
`Calculator_calculate`.  Notice that the call signature for the stub
functions matches exactly the types specified by the WebIDL file; the
underlying mechanics of hooking into the interpreter (e.g.,
marshaling/unmarsharling parameters) is handled by all of the
underlying C code (that we encourage the user to ignore).

So again: inside of `Calculator\_calculator`, look for the string
"USER CODE GOES HERE" – all code produced by the compiler will have this
string wherever the user needs to specialize the code – and add the
following.  (Notice that each value in an enumeration type has as its
prefix the name of the enumeration type; this is because C doesn't
distinguish between two enumeration-type values in separate enumeration
types, leading to annoying name clashes.  The way around this was to
tack on the enumeration type's name to each of its values – if this is
too burdensome, the generator accepts the "–leave\_enums\_alone=true"
flag.)

``` syntaxhighlighter-pre
switch (function)
{
    case Calculator_Function_add:
        return arg1 + arg2;
    case Calculator_Function_subtract:
        return arg1 - arg2;
    case Calculator_Function_multiply:
        return arg1 * arg2;
    case Calculator_Function_divide:
        return arg1 / arg2;
}
```

#### Building Jerryscript

To build the interpreter with the `Calculator` example, go into the
`simple_calculator` directory.  

``` syntaxhighlighter-pre
cd simple_calculator
```

In this directory are the files created from the WebIDL input.  We will
need to compile these with a main routine and then link all of these
with the interpreter libraries.  The command is:

``` syntaxhighlighter-pre
gcc -g --std=c99 -Djerry_value_has_error_flag=jerry_value_is_error -I../../jerryscript/jerry-port/default/include -I../../jerryscript/jerry-core/include -I../../jerryscript/jerry-ext/include -I../../jerryscript/jerry-ext/include/jerryscript-ext -I. ../../JerryGen/unit_tests/template/main_jerrygen.c *.c ../../jerryscript/build/lib/libjerry-core.a ../../jerryscript/build/lib/libjerry-ext.a ../../jerryscript/build/lib/libjerry-port-default.a -lm && ./a.out
```

...this will build and run (b/c the command ends with "&& ./a.out") the
command line interpreter.  Because all of the paths are relative (i.e.,
"../.."), this command will work for building all of the examples in the
rest of the document – the usual method is to build a package with the
generator, cd into that directory, modify the \*\_stubs.c file(s), and
use the above command to compile and get an interpreter.

Try the <span class="inline-comment-marker"
data-ref="6f78a50f-29b6-4f43-819f-762cb6a6c710">following
commands</span> (use "control-d" on a blank line to end the repl):

``` syntaxhighlighter-pre
var calc = new Calculator;
print(calc.calculate("add", 1.55, 3.77));
print(calc.calculate("divide", 1.55, 3.77));
```

#### Accessing Attributes

Notice that we haven't provided all of the functionality that we
promised; we designed the Calculator to only compute values to a
specified degree of accuracy, but we didn't utilize the
`digits_of_precision` attribute.

Attributes live on the (Javascript) object that is the interface, so we
use a macro/function to call into the Javascript environment and get an
attribute's value.  The INTERFACE\_EXTRACT macro is defined in the <span
style="font-family: monospace;">webidl\_compiler\_utilities</span> file.
 The macro is used to access any attribute by giving the attribute name
as one of the parameters to the macro.  The macro is just shorthand for
calls to each attribute's `extract` function: the naming convention for
attribute access functions is:
get`_<Interface Name>_<attribute_name>(), if you want to use those directly`,
and the parameter is the function argument <span
style="font-family: monospace;">this</span>, which is a handle back
through the interpreter to the Javascript object.  For these examples,
we'll use the macro; but it may be a better interface to allow the user
to call the `extract_*` functions directly, which is why we've included
them.

With that function, we can rewrite the `Calculator_calculate`
function to use the `digits_of_precision` attribute as follows:

``` syntaxhighlighter-pre
float answer;
switch (function)
{
    case Calculator_Function_add:
        answer = arg1 + arg2;
        break;
    case Calculator_Function_subtract:
        answer = arg1 - arg2;
        break;
    case Calculator_Function_multiply:
        answer = arg1 * arg2;
        break;
    case Calculator_Function_divide:
        answer = arg1 / arg2;
        break;
}

/* move the decimal over by the amount to shift, type-convert this new
   value into an integer to truncate the remaning decimal, and shift it back */
int shift_amount = 1;
for(int i = 0; i < INTERFACE_EXTRACT(this, Calculator, digits_of_precision); i++)
    shift_amount *= 10;
answer = (float)((float)((int)(answer*shift_amount))/(float)(shift_amount));

 return answer;
```

...and now try the following commands.  Notice that we have built a new
`Calculator` object and supplied a value for the attribute
digits\_of\_precision – constructors assign their parameters in order of
the WebIDL declarations, so if an interface, I, has <span
class="inline-comment-marker"
data-ref="6e5006c5-5761-4fd9-8611-12126e61cf74">attributes named a, b,
and c,</span> the command "`new_thing = new I(x, y, z)"`, will assign
`x` to `a`, `y` to `b`, and <span
style="font-family: monospace;">z</span> to <span
style="font-family: monospace;">c</span>.  Our WebIDL compiler includes
default values for all types, so if not all of the attributes are filled
in by the constructor, those fields get initialized with a default
value. 

``` syntaxhighlighter-pre
var calc = new Calculator(2);
print(calc.calculate("add", 1.55, 3.77));
print(calc.calculate("divide", 1.55, 3.77));
```

#### Using Callbacks

... the answers in our example are close to what we'd like to see, but
not exactly.  Although not the main point, the example illustrates the
problem of handing values between differing environments – Javascript's
only numeric type is a double, so converting between
ints/longs/floats/doubles/etc. is likely to give slightly different
results.

An alternative approach will work better.  Since we suspect that the
problem is the handoff between different environments, we can perform
the rounding in the Javascript environment by using a callback that we
will store as part of the interface.  Let's create a new file, called
`simple_calculator2.idl`, that will have the updated interface:

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

interface Calculator {
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Function function, float arg1, float arg2 );
};
```

...build the files with the generator (notice that we're using the
"`simple_calculator2.idl`" file and creating the files in a new
directory, "simple\_calculator2") :

``` syntaxhighlighter-pre
../JerryGen/generate.js --output_utility_files --package=simple_calculator2 simple_calculator2.idl
```

...and we'll augment the `Calculator\_calculate` function as follows.  Note
that invoking a Javascript function from the C code requires an
additional parameter, the "this" pointer that all operation's bodies
have as their last parameter.  As a result, the C type associated with a
callback is actually the native type of the interpreter, what we call
"`Interpreter_Type`" – in practice, this is just an integer handle to an
interpreter-internal value, and because we don't have direct access to
it, we will always invoke callbacks through a wrapper whose name follows
the pattern: "run\_&lt;callback\_name&gt;\_function", and its parameters
will be the `Interpreter_Type` value representing this kind of callback,
the "`this`" pointer, and then the actual parameters of the callback.

In the code below, 

``` syntaxhighlighter-pre
float answer;
switch (function)
{
    case Calculator_Function_add:
        answer = arg1 + arg2;
        break;
    case Calculator_Function_subtract:
        answer = arg1 - arg2;
        break;
    case Calculator_Function_multiply:
        answer = arg1 * arg2;
        break;
    case Calculator_Function_divide:
        answer = arg1 / arg2;
        break;
}

/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                               answer, shift_amount);

return answer;
```

Now, build an interpreter with the files in the simple\_calculator2
directory and try these Javascript commands:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator(2, round);
print(calc.calculate("multiply", 1.55, 3.77));
```

...you'll notice that we still get some rounding errors – as an aside,
you can get the answer we're looking for inside of Jerryscript by typing
the following directly at the Jerryscript prompt:

``` syntaxhighlighter-pre
print(calc.round_it(calc.calculate("multiply", 1.55, 3.77), 2));
```

**Using dictionaries**

Now imagine that we want to send in the arguments and calculator
operation directly in to the `calculate` method.  We can use a
dictionary for this:

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

dictionary Calculator_Arguments {
     Calculator_Function function;
     float arg1;
     float arg2;
};

interface Calculator {
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Arguments args );
};
```

Cut/paste this into a file called `simple_calculator3.idl` and invoke
the generator.  The following code should be pasted into
`Calculator\_calculate`:

``` syntaxhighlighter-pre
float answer;

switch (args.function)
{
    case Calculator_Function_add:
        answer = args.arg1 + args.arg2;
        break;
    case Calculator_Function_subtract:
        answer = args.arg1 - args.arg2;
        break;
    case Calculator_Function_multiply:
        answer = args.arg1 * args.arg2;
        break;
    case Calculator_Function_divide:
        answer = args.arg1 / args.arg2;
        break;
}

/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                               answer, shift_amount);

return answer;
```

...and now with our new interface, some slightly modified Javascript:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator(2, round);
var args = new Calculator_Arguments("multiply", 1.55, 3.77);
print(calc.calculate(args));
```

Or -- all in one cut/paste:
``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);}; var calc = new Calculator(2, round); var args = new Calculator_Arguments("multiply", 1.55, 3.77); print(calc.calculate(args));
```

#### Arrays

Now let's build a calculator with an added feature: our new calculator
should be able to calculate on an arbitrary number of arguments.  For
this, we'll use WebIDL's "sequence" declaration, which is analogous to C
arrays.  Because we need to know the length of an array, all arrays
translated from WebIDL will be structs containing the array of values
plus a field containing the length of the array of values.

The WebIDL for `simple_calculator4.idl` looks like:

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

dictionary Calculator_Arguments {
     Calculator_Function function;
     sequence<float> args;
};

interface Calculator {
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Arguments args );
};
```

Notice that invoking the generator on this file produces more files than
the last example – arrays, because they are structs in their own right,
will produce their own .c/.h files.

The code for `Calculator_calculate` is:

``` syntaxhighlighter-pre
float answer = 0.0;
if (args.function == Calculator_Function_multiply || args.function == Calculator_Function_divide)
    answer = 1.0;

for (int i = 0; i < args.args.length; i++)
    switch (args.function)
    {
        case Calculator_Function_add:
            answer += args.args.items[i];
            break;
        case Calculator_Function_subtract:
            answer -= args.args.items[i];
            break;
        case Calculator_Function_multiply:
            answer *= args.args.items[i];
            break;
        case Calculator_Function_divide:
            answer /= args.args.items[i];
            break;
    }

/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                        answer, shift_amount);

return answer;
```

...and the Javascript commands now look like:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator(2, round);
var args = new Calculator_Arguments("multiply", [1.55, 3.77]);
print(calc.calculate(args));
```

Or -- all in one cut/paste:
``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);}; var calc = new Calculator(2, round); var args = new Calculator_Arguments("multiply", [1.55, 3.77]); print(calc.calculate(args));
```

#### Composite Types

Now, let's suppose that we want our calculator to handle lists of floats
or integers.  We could write a whole new `calculate` function that takes
longs instead of floats, but WebIDL has a way to specify "composite"
types, types made up of more than one other type.  The syntax is the
composite types are surrounded by parentheses and joined by the word
"or".  For example, imagine that we want a dictionary to hold one of two
enumeration types – the WebIDL would look something like:

``` syntaxhighlighter-pre
enum ordinal_number { "first", "second", "third" };
enum nominal_number { "one", "two", "three" };


dictionary number {
    (ordinal_number or nominal_number) value;
};
```

...in C, composite types are represented as unions.  The canonical
method of implementing unions in C is with a struct with two fields: the
first field describes which of the members is stored in the union, while
the second is the union itself.  In the above example, the generator
would produce the following structure for use in the `number`
dictionary:

``` syntaxhighlighter-pre
typedef struct {
    int union_type;
    union {
        nominal_number nominal_number_field;
        ordinal_number ordinal_number_field;
    } value;
} nominal_number_or_ordinal_number;
```

...notice that the name of the union is simply a concatenation of the
types in the WebIDL file – we flatten the composite (i.e.: "(a or (b or
(c or d)))" is treated as "(a or b or c or d)"...) and alphabetize the
types to canonicalize the name of each composite type.  Each member of
the union is the type name with "`_field`" tacked on to the end.

This brings us back around to a detail mentioned at the beginning of
this document: what are the `<type_name>_uid` values used for?  As we
said, every type, both the intrinsic types and types built in the WebIDL
files have their own uid, and it is used in the union's structure to
describe the union's member type.

So now, let's modify our latest calculator to accept an array of either
long or float values (we're now on simple\_calculator5):

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

dictionary Calculator_Arguments {
     Calculator_Function function;
     sequence<(float or long)> args;
};

interface Calculator {
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Arguments args );
};
```

...and the C code for `Calculator_calculate`:

``` syntaxhighlighter-pre
float answer = 0.0;
if (args.function == Calculator_Function_multiply || args.function == Calculator_Function_divide)
    answer = 1.0;

for (int i = 0; i < args.args.length; i++)
{
    float_or_long next_arg = args.args.items[i];
    float arg;
    switch(next_arg.union_type)
    {
        case float_uid:
            arg = next_arg.value.float_field;
            break;
        case long_uid:
            arg = (float) next_arg.value.long_field;
            break;
    }
    switch (args.function)
    {
        case Calculator_Function_add:
            answer += arg;
            break;
        case Calculator_Function_subtract:
            answer -= arg;
            break;
        case Calculator_Function_multiply:
            answer *= arg;
            break;
        case Calculator_Function_divide:
            answer /= arg;
            break;
    }
}
/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                        answer, shift_amount);
return answer;
```

...and try the following Javascript:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator(2, round);
var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]);
print(calc.calculate(args));
```

Or -- all in one cut/paste:
``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);}; var calc = new Calculator(2, round); var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]); print(calc.calculate(args));
```

#### Native Objects

At the beginning of this tutorial, we recommended ignoring a large block
of code at the beginning of the `Calculator_stubs.c` file.  This code
relates to a "hidden" piece of memory that gets associated with each
interface.  The idea is that because the interface is being computed on
the C side of the interpreter and implements libraries that remain
opaque to the Javascript user, it may be necessary to save "state" of
the interface that is invisible/inaccessible to the user.

The Jerryscript interpreter calls these "`Native Objects`", so we just
borrowed the name – a `Native Object` is a piece of memory that
Jerryscript associates with a Javascript object and can be accessed by
the C code (specifically, each of the operations/methods in an
interface).

As we've seen from our running example, interfaces are fully functional
without utilizing the `Native Object` data structure.

In our running example, let's add a feature to the calculator that every
tenth time we call `calculate`, we'll print out an extra message
congratulating the user.

To keep track of the call count, go into `Calculator_stubs.h` and edit
the data structure named `Calculator_Native_Object`:

``` syntaxhighlighter-pre
typedef struct {
    /* USER CODE GOES HERE */
    int call_count;
} Calculator_Native_Object;
```

...now, we need to tell the code how to initialize the `Native Object`
for our `Calculator` interface.  This can be found in
`Calculator_stubs.c`, and is the function `create_Calculator_Native_Object`; the
code defaults to malloc'ing the` Calculator_Native_Object` data
structure, and we can add our own code to perform initialization of our
`Native Object`.  This function gets called each time a new interface
gets created.

``` syntaxhighlighter-pre
Calculator_Native_Object *create_Calculator_Native_Object(void)
{
    Calculator_Native_Object *new_object = (Calculator_Native_Object *)malloc(sizeof(Calculator_Native_Object));

        /* USER CODE GOES HERE */
    new_object->call_count = 0;
    return new_object;
} /* create_Calculator_Native_Object */
```

...Jerryscript is garbage collected, so when it needs to garbage-collect
an interface, we need to tell it how to deallocate the `Native Object`
associated with the interface.  The deallocating function is co-located
with the create function – in our example, it is called
`destroy_Calculator_Native_Object`, and we would want to put a call
to free here, so that when an `Calculator` interface gets deallocated,
we also free the memory associated with our call counter:

``` syntaxhighlighter-pre
void destroy_Calculator_Native_Object(void *native_object)
{
        /* USER CODE GOES HERE */
    free(native_object);
} /* destroy_Calculator_Native_Object */
```

...and now we see the purpose of the code at the top of the
`Calculator_calculate` function: each method retrieves the pointer to
the `Native Object` associated with the method's interface.  Now, in
our example, adding code to increment the count at each call is
straightforward.

As a last point: all of the stubs contain a call to Native\_Object\_get
to set up a local pointer to the interface's Native\_Object.  If a
particular stub does not use that pointer, this call should, for
efficiency, be removed – also, if the pointer changes to point to a new
object, the programmer has to remember to include a call to
Native\_Object\_set to ensure that the interface gets the new value.

#### Separate Compilation – the ExternalInterface attribute

Although WebIDL does not have a model for separate compilation, we know
that C programmers especially will not want to compile entire,
monolithic programs.  In this section, we'll look at how to create
separately compilable glue/stub code from different .idl files that can
be compiled into a single interpreter.

First, WebIDL allows the writer to attach arbitrary attributes to
interfaces – each attribute may not be part of the language (like a
reserved word), the list of attributes can be any length, and
interpreters are free to ignore them.  These attributes precede the
`interface` declaration and are declared as a comma-separated list
surrounded by square brackets.

Supporting separate compilation requires a mechanism to list, in one
file, interfaces that might be defined in a separate file.  For this, we
use an attribute called `ExternalInterface` that takes a single
parameter, the name of the external interface.

As an example, imagine that we have an interface with a single operation
that takes two parameters, both of which are external.  The .idl file
would look like this:

``` syntaxhighlighter-pre
[ ExternalInterface=(Extern_Int1), ExternalInterface=(Extern_Int2) ]
interface Example_Interface {
    void foo(Extern_Int1 x, Extern_Int2 y);
};
```

 ...here, the user will generate code for `Extern_Int1`
and `Extern_Int2 at a different time`.  This declaration allows the
WebIDL compiler to put out \#include directives in the C code.

To make this concrete, let's imagine that our calculator is used by
teachers to monitor their students' activity – the students call the
calculator with a special data structure the teacher controls.  For
this, create a file called teacher.idl with the following .idl code:

``` syntaxhighlighter-pre
interface Teacher_Feedback {
    void record_activity(string student_name);
};
```

...and compile that with the usual command:

``` syntaxhighlighter-pre
../JerryGen/generate.js --package=teacher teacher.idl
```

Notice that we didn't generate utility files; this only needs to be done
once per compilation, and we'll do it when we compile our new
calculator, below.

For now, we'll make the body of "record\_activity" a simple printf just
to show it's working:

``` syntaxhighlighter-pre
printf("Inside record_activity, with student: %s\n", student_name);
```



Now, we'll modify the WebIDL from simple\_calculator5.idl and write it
into simple\_calculator6.idl by adding
the `Teacher_Feedback` interface (compile it with the usual call to the
generator) :

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

dictionary Calculator_Arguments {
     Calculator_Function function;
     sequence<(float or long)> args;
};

[ExternalInterface=(Teacher_Feedback)]
interface Calculator {
    attribute string student_name;
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Arguments args, Teacher_Feedback my_teacher );
};
```

It is instructive to show how this code would be used inside
of `calculate`.  Because the `my_teacher` parameter is an interface and
interfaces live in memory on the Javascript side, we need to use a
special macro designed to call functions that are stored as interface
attributes.  Add the following code to `Calculator\_calculate`
in \`Calculator\_stubs.c\`.

``` syntaxhighlighter-pre
/* call the teacher's interface */
string student_name = INTERFACE_EXTRACT(this, Calculator, student_name);
Teacher_Feedback_record_activity(my_teacher, student_name, _error);

float answer = 0.0;
if (args.function == Calculator_Function_multiply || args.function == Calculator_Function_divide)
    answer = 1.0;

for (int i = 0; i < args.args.length; i++)
{
    float_or_long next_arg = args.args.items[i];
    float arg;
    switch(next_arg.union_type)
    {
        case float_uid:
            arg = next_arg.value.float_field;
            break;
        case long_uid:
            arg = (float) next_arg.value.long_field;
            break;
    }
    switch (args.function)
    {
        case Calculator_Function_add:
            answer += arg;
            break;
        case Calculator_Function_subtract:
            answer -= arg;
            break;
        case Calculator_Function_multiply:
            answer *= arg;
            break;
        case Calculator_Function_divide:
            answer /= arg;
            break;
    }
}
/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                        answer, shift_amount);
return answer;
```

Now generate the new calculator with the usual command.  It's
instructive to look at the command used to compile a new interpreter:

``` syntaxhighlighter-pre
gcc -g --std=c99 -Djerry_value_has_error_flag=jerry_value_is_error -I../../jerryscript/jerry-port/default/include -I../../jerryscript/jerry-core/include -I../../jerryscript/jerry-ext/include -I../../jerryscript/jerry-ext/include/jerryscript-ext -I. -I../teacher ../../JerryGen/unit_tests/template/main_jerrygen.c *.c ../teacher/*.c ../../jerryscript/build/lib/libjerry-core.a ../../jerryscript/build/lib/libjerry-ext.a ../../jerryscript/build/lib/libjerry-port-default.a -lm && ./a.out
```

Note that we added both the C code ("`../teacher/*.c`") and the include
path to the Teacher\_Feedback code ("`-I../teacher`").  Also remember to
set up the Native\_Object itself as we showed in the previous section.

...and the Javascript for this example:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator("Michael", 2, round);
var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]);
var teacher = new Teacher_Feedback;
print(calc.calculate(args, teacher));
```

Or -- all in one cut/paste:
``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);}; var calc = new Calculator("Michael", 2, round); var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]); var teacher = new Teacher_Feedback; print(calc.calculate(args, teacher));
```

#### Using the Native\_Object structure and calling JerryGen-created functions directly

The example with the Teacher\_Feedback is unrealistic (`calculate` does
not need an extra, largely unrelated parameter); in the next example, we
build on the Teacher\_Feedback idea, but this time, the `Calculator`
object will have a hidden structure holding the `Teacher_Feedback`
interface.  The idea is that the teacher will want to monitor his
student's use of the calculator, but that monitoring should be
transparent to the student.  To do this, we'll set up the
`Teacher_Feedback` interface in the `create_Calculator_Native_Object`
function, which it gets when initializing a `Calculator` interface.

We'll start with a (slightly) simplified `.idl` file, which we'll call
`simple_calculator7.idl`:

``` syntaxhighlighter-pre
enum Calculator_Function { "add", "subtract", "multiply", "divide" };

callback rounding_function = float (float unrounded_value, long precision);

dictionary Calculator_Arguments {
     Calculator_Function function;
     sequence<(float or long)> args;
};

interface Calculator {
    attribute string student_name;
    attribute long digits_of_precision;
    attribute rounding_function round_it;
    float calculate( Calculator_Arguments args );
};
```

Notice that we have removed the ExternalInterface attribute on the
Calculator interface – the user of this API will no longer see the
Teacher\_Feedback interface (because we have removed it from the call to
`calculate`), even though we will still use it in
the `Calculator\_calculate` function.

We need to define the `Native_Object` to contain the `Teacher_Feedback`
object, so add the following code to `Calculator_Native_Object` struct
definition in `Calculator_stubs.h`:

``` syntaxhighlighter-pre
    Teacher_Feedback feedback_interface;
```

...of course, since we have introduced a type that wasn't derived from
the WebIDL file by JerryGen, we need to add the include file at the top
of `Calculator_stubs.h` manually (after the inclusion of "rounding_function.h"):

``` syntaxhighlighter-pre
#include "Teacher_Feedback_stubs.h"
```

...and then set up the interface inside of
`create_Calculator_Native_Object()` – this will create a new
`Teacher_Feedback` each time the `Calculator` constructor is called.

``` syntaxhighlighter-pre
    new_object->feedback_interface = Teacher_Feedback_constructor();
```

For the body of `calculate`, notice that we can derive the C functions
that get created for each construct in a WebIDL file.  (Some day, we'll
have a guide showing all of the names that the compiler creates...)
 Thus, the constructor for a `Teacher_Feedback` is called
`Teacher_Feedback_constructor()`.

<span style="letter-spacing: 0.0px;">...all of these examples exemplify
a very important rule for using JerryGen: </span>***ONLY ADD CODE TO THE
\*\_stubs FILES***<span style="letter-spacing: 0.0px;">.  Remember that
the `*_stubs` files are retained when we recompile a `.idl` file, while
all of the rest of the code is overwritten.</span>

For completeness, don't forget to free the memory from the call to
create_Calculator_Native_Object:

``` syntaxhighlighter-pre
    free(native_object);
```

Now, the body of `calculate` uses the `Teacher_Feedback` interface that
is stored in the `native_object` variable.  Its single operation has a
name that can be derived from its WebIDL file (remember that we have to
add the `this` pointer – here, the object stored in the
`Native_Object`) :

``` syntaxhighlighter-pre
/* call the teacher's interface */
string student_name = INTERFACE_EXTRACT(this, Calculator, student_name);
Teacher_Feedback_record_activity(native_object->feedback_interface, student_name, _error);

float answer = 0.0;
if (args.function == Calculator_Function_multiply || args.function == Calculator_Function_divide)
    answer = 1.0;

for (int i = 0; i < args.args.length; i++)
{
    float_or_long next_arg = args.args.items[i];
    float arg;
    switch(next_arg.union_type)
    {
        case float_uid:
            arg = next_arg.value.float_field;
            break;
        case long_uid:
            arg = (float) next_arg.value.long_field;
            break;
    }
    switch (args.function)
    {
        case Calculator_Function_add:
            answer += arg;
            break;
        case Calculator_Function_subtract:
            answer -= arg;
            break;
        case Calculator_Function_multiply:
            answer *= arg;
            break;
        case Calculator_Function_divide:
            answer /= arg;
            break;
    }
}
/* use the callback to round the answer before returning */
rounding_function rounding_func = INTERFACE_EXTRACT(this, Calculator, round_it);
int shift_amount = INTERFACE_EXTRACT(this, Calculator, digits_of_precision);

answer = (float)run_rounding_function(rounding_func, this,
                                        answer, shift_amount);
return answer;
```

Now generate the new calculator with the usual command.  (We didn't need
to recompile teacher.idl; we assume it is still there from the previous
example...)

``` syntaxhighlighter-pre
gcc -g --std=c99 -Djerry_value_has_error_flag=jerry_value_is_error -I../../jerryscript/jerry-port/default/include -I../../jerryscript/jerry-core/include -I../../jerryscript/jerry-ext/include -I../../jerryscript/jerry-ext/include/jerryscript-ext -I. -I../teacher ../../JerryGen/unit_tests/template/main_jerrygen.c *.c ../teacher/*.c ../../jerryscript/build/lib/libjerry-core.a ../../jerryscript/build/lib/libjerry-ext.a ../../jerryscript/build/lib/libjerry-port-default.a -lm && ./a.out
```

Note that we added both the C code ("`../teacher/*.c`") and the include
path to the Teacher\_Feedback code ("`-I../teacher`").

...and the Javascript for this example:

``` syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);};
var calc = new Calculator("Cindy-Lou", 2, round);
var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]);
print(calc.calculate(args));
```


Or, all in one cut/paste:

```syntaxhighlighter-pre
var round = function(value, amount) { return Number(Math.round(value+'e'+amount)+'e-'+amount);}; var calc = new Calculator("Cindy-Lou", 2, round); var args = new Calculator_Arguments("multiply", [1.55, 3.77, 2]); print(calc.calculate(args));
```

<span style="font-weight: bold;">A FInal Challenge:</span>

The calculator starting with simple\_calculator5.idl is a little odd, in
that we pass in an array of either longs or floats, whereas usually
you'd pass in an array of all floats or all longs.  Create a new
`Calculator` that expects either an array of floats or an array of
longs.

#### Next: See [Part 2](https://github.com/t-harvey/JerryGen/blob/master/docs/tutorial_part2.md)

Document generated by Confluence on Feb 15, 2019 17:04

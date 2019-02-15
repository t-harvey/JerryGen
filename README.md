# JerryGen
A WebIDL to Jerryscript-glue-code compiler

### Overview
This compiler takes as input a subset of WebIDL and produces C-code that will "glue" existing C libraries into Jerryscript using that API.  The overarching purpose is to allow existing C code libraries to be used in other languages without having to rewrite those libraries, and Javascript, implemented by Jerryscript, is the first language that we attack.  Details of the high-level design can be found in our [whitepaper](../docs/TLC_scripting_submission_2017.pdf) and [poster](../docs/Scripting_Poster.pdf) presented at the TI Technical Conference in 2017.

We currently support only a subset of the large [WebIDL standard](https://github.com/w3c/webidl2.js).
Our design goal was to support the functionality that makes sense for
programming embedded architectures, and we used the [zephyr.js project](https://github.com/intel/zephyr.js)
as our guide.

<details>
<summary>Click here to see the list of WebIDL constructs
supported.</summary>
<dl style="list-style-type:none;">
<dt> Enumeration types </dt>
<dd> - these are strings in WebIDL and Javascript, but we treat them as
proper enum types in C.
<dt> Callbacks </dt>
<dd> - these are function pointers in all three languages.
<dt> Dictionaries </dt>
<dd> - these are data structures in all three languages.
<dt> Interfaces </dt>
<dd> - these are objects, containing both methods and attributes, and
as such, are stored in the Javascript environment and only accessed by
getters/setters on the C side.
</dl>
</details>

### Building the generator

JerryGen is controlled by the generate.js script, found in the
generator repo.

<details>
<summary>Click to show installation instructions for the
generator.</summary>
Clone the generator repo:<p>
<code>git clone https://github.com/t-harvey/JerryGen.git</code><p>

The generator is built on top of Javascript, so no compilation of the
tool is necessary.
</details>

<details>
<summary>Click to show installation instructions for node packages.</summary><br>
First, if you clone the repo and cd into that directory, you should be
able to run a single command:<p>

<code>npm install</code><p>

...if that doesn't work, the individual steps are as follows:

#### the WebIDL parser:
<code>sudo npm install -g webidl2</code>

#### file i/o:<br>
<code>sudo npm install -g q-io<br>
npm install file-exists</code><br>
#### ast compiler:
<code>sudo npm install -g hogan.js</code><br><br>
(NOTE: "hogan.js", not "hogan"!)<br>
#### boost-y type functions:
<code>sudo npm install lodash</code><br>
#### continuation passing/async calls through promises:
<code>sudo npm install q</code><br>

<code>npm install minimist</code>

...then set NODE_PATH to /usr/local/lib/node_modules (the "-g" on the
npm-install command puts them here; you can alternatively install them
locally, and then do the obvious...
</details>


### Building Jerryscript
<details>

The instructions for building Jerryscript are
[here](https://github.com/pando-project/jerryscript/blob/master/docs/01.GETTING-STARTED.md)
-- note that building Jerryscript without ES2015 features can give
results that are difficult to pin down.  For example, if the config.h
file in the jerry-core directory does not have the variable
<code>CONFIG_DISABLE_ES2015_TYPEDARRAY_BUILTIN</code> commented out,
then any attempt to use the ArrayBuffer in a script will result in a
"script error" message from the interpreter, even though the script
containing the <code>ArrayBuffer</code> declaration may be otherwise
error free.  Of course, if a user's scripts don't use
<code>ArrayBuffer</code>, then it might behoove him to compile without
that feature and thus minimize the size of the interpreter.<p>

Using <code>tools/build.py</code> will produce libraries in the
<code>build/lib</code> directory.  To get an executable interpreter,
these libraries must be linked in to a <code>main.c</code> file.  The
main.c file provided in the generator directory also requires the
JerryGen utility files, which are produced by running the generator
with the <code>--output_utility_files</code> flag.

We provide an empty WebIDL file for just such a minimal build.
Assuming that the user has cloned both the generator and Jerryscript
into a directory called <code>work</code>, the commands to build a
barebones parser are as follows:<p>

<code>
<b>~/work -></b> generator/generate.js --output_utility_files --package=empty  generator/unit_tests/template/empty.idl<p>
<b>~/work -></b> gcc -g --std=c99 -Djerry_value_has_error_flag=jerry_value_is_error -Ijerryscript/jerry-port/default/include -Ijerryscript/jerry-core/include -Ijerryscript/jerry-ext/include -Ijerryscript/jerry-ext/include/jerryscript-ext/ -I./empty generator/unit_tests/template/main_jerrygen.c empty/webidl*.c jerryscript/build/lib/libjerry-core.a jerryscript/build/lib/libjerry-ext.a jerryscript/build/lib/libjerry-port-default.a -lm<p>
<b>~/work -></b> ./a.out<p>
</code>
</details>


### Further Documentation

Consult the two-part tutorial, [here](../docs/tutorial_part1) and [here](../docs/tutorial_part1).

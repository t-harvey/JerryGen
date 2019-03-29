When we translate WebIDL into C code, we often need to modify the
names slightly to account for C rules.  This document will explain all
of the conventions.

## File Names

Each instance of an enumeration or callback type causes the creation
of one .c file and two .h files; one of the header files contains a
set of functions and data structures that are considered "private";
i.e., of no concern to the C programmer, because they describe
functionality related only to the interior workings of the code used
to interface with the interpreter.  The other, "public", header file
contains functionality that can be used by the C programmer.  The
names of the files come from the names of the types, and the "private"
header files are denoted by the "_private" suffix.

In addition to those three files, interfaces also induce a .h/.c pair
of stubs files (denoted by the <code>_stubs</code> prefix).

| WebIDL Type | Files | Example WebIDL Construct | Example Files Created |
| --- | --- | --- | --- |
| Enumerations | .h/.c | "enum_name" | enum_name.h<br>enum_name_private.h<br>enum_name.c |
| Callbacks | .h/.c | "callback_name"| callback_name.h<br>callback_name_private.h<br>callback_name.c |
| Definitions | .h/.c | "definition_name" | definition_name.h<br>definition_name_private.h<br>definition_name.c |
| Interfaces | .h/.c | "interface_name" | interface_name.h<br>interface_name_private.h<br>interface_name.c<br>interface_name_stubs.h<br>interface_name_strubs.c |

## Similarities of all of the (public) header files

Regardless of the WebIDL type, all of the header files have a two
constructs that are the same.  First, every type needs a unique
identifier that gets used in composite types (explained below).  This
value should be considered read only and accessed only through the
variable, as it can change each time the code is compiled.  The second
construct is the constructor function; although not every type
requires a constructor function, we assume the existence of such a
function for each type to simplify code production -- if the type in
question doesn't actually need the function, it will turn into an
empty call.

## Enumeration Types

In WebIDL and Javascript, enumeration values are strings.  In C, the
names are simple integers, but their namespaces are shared -- this
means that if you have two enumeration types, <code>foo1</code> and
<code>foo2</code>, with the same value, say, <code>bar</code>, the C
compiler will refuse to compile that code, because it has no way to
distinguish <code>bar</code> in <code>foo1</code> from
<code>bar</code> in <code>foo2</code>.

To solve this problem, we prefix each enumeration value with its type
name.  In our example, we would have the values <code>foo1_bar</code> and
<code>foo2_bar</code>, which would not conflict.

### Public header file for enumeration types

The public header file for enumeration types includes the uid and
constructor function, as well as the typedef of the <code>enum</code>
type.

## Callbacks

Callbacks are objects that live on the Javascript side, so they are
accessed through an abstraction function.  Callbacks are
called with the "run" routine provided for each callback type.  The
name derives from the name of the callback, so a callback named
"callback_name" would be called with the function,
"run_callback_name", provided in <code>callback_name.h</code>.

### Public header file for callbacks

Because callbacks are abstracted, the top of each callback-header
file typedefs the Interpreter_Type to that name.  The actual function
prototype follows, and that name is the callback name plus the suffix
<code>_callback</code>.  Finally, each callback can be run from C code
with the <code>run_</code> function.

## Dictionaries

Dictionaries are copied back and forth between the Javascript
environment and the C side, so the header file for Dictionaries starts
with a typedef of a struct matching the definition of the WebIDL
dictionary.  The name of the struct is the name of the dictionary.

## Interfaces

Interfaces are stored on the Javascript side, so we represent
them as abstractions -- the interface's type is just the
Interpreter_Type, and we provide getters and setters to access the
attributes.  The exception to this is the operations, which can be
called directly, because those functions are represented in the
<code>stubs</code> file.

### Public header file for interfaces

Interfaces have a Native_Object value associated with them, so the
interface's public header has a getter and setter for this value --
the names are built by attaching "get" or "set" to the interface name
plus the string "Native_Object.  For an interface named
<code>foo</code>, the getter would be named
<code>foo_Native_Object_get</code>.

The getters and setters for attributes build their names using their
function ("get" or "set") as a prefix, and then building up the rest
of the name from combining the interface name with the attribute
name.  For example, the getter function for an attributed named
<code>bar</code> in an interfaced named <code>foo</code> would be
named <code>get_foo_bar</code>, while the setter for that attribute
would be named <code>set_foo_bar</code>.


## Arrays of types

All WebIDL arrays are represented in C as if they had come from WebIDL
dictionaries -- that is, all of the constructs found in the header
file for a dictionary will be found in the header file for an array.

The C struct for an array will contain an integer showing the number
of values in the array, and then the array itself.  The name of the
array structure will be the name of the type with the suffix "_array".
For example, the struct for an array of <code>foo</code> objects would
have the name <code>foo_array</code>; an array of
<code>foo_array</code>s would be named <code>foo_array_array</code>.

## Composite types

Composite types are represented in C as a struct containing a union
and a type field showing which of the union's entries is active.  The
name of the struct is a concatenation of the included types joined by
"_or_".  For example, a WebIDL type of "long or float" would generate
three C files with the name <code>float_or_long</code>.  Note that we
alphabetize the types before joining them into a single name; this
ensures that we keep code size as small as possible by equating the
WebIDL types "long or float" and "float or long".

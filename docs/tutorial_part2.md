1.  [Scripting](index.html)
2.  [Scripting Home](Scripting-Home_76288708.html)

<span id="title-text"> Scripting : JerryGen Types (Part 2 of the JerryGen tutorial) </span>
===========================================================================================

Created by <span class="author"> Timothy Harvey</span>, last modified on
Oct 29, 2018

(For Part 1 of this tutorial, [click
here.](https://confluence.itg.ti.com/display/Scripting/Using+JerryGen%2C+the+WebIDL+Compiler))

  

In the first part of the JerryGen tutorial, we worked through an example
as a way to introduce the system and some of its types.  In this part,
we'll look at more types through the design of the system.

#### The ArrayBuffer Type

Both WebIDL and Javascript have a type called `ArrayBuffer`, whose
behavior can be understood by a C programmer as analogous to a
"`void *`" pointer.  The user declares an `ArrayBuffer` to have a
certain size but cannot assign values to it until they declare a
different variable as a "`TypedArray`" of the original variable.  In the
following example, we create an `ArrayBuffer` of 10 bytes and assign two
different typed arrays to it:

``` syntaxhighlighter-pre
jerry> var x = new ArrayBuffer(10)
undefined
jerry> var y = new Int8Array(x)
undefined
jerry> var z = new Int16Array(x)
undefined
jerry> y
0,0,0,0,0,0,0,0,0,0
jerry> z 
0,0,0,0,0
jerry> 
```

...two things to notice from the above example:

1.  `y`'s data type is half the size of `z`'s data type – when we print
    out the two arrays, `y` has twice as many elements
2.  all of the data is zero'd-out at instantiation

Now, if we modify `z` with the integral value 2052 (which has a hex
representation of 0x0804) :

``` syntaxhighlighter-pre
jerry> z[0] = 2052
2052
jerry> y
4,8,0,0,0,0,0,0,0,0
jerry> z
2052,0,0,0,0
jerry> 
```

...notice, first, that `y` is affected when we update `z`.  Further,
notice that the bytes are being stored in little-endian order, as that
was a flag we used when compiling Jerryscript.

To a C programmer, similar code might look like this:

``` syntaxhighlighter-pre
void *x = (void *)malloc(10*sizeof(unsigned char));
int8_t *y = x;
int16_t *z = x;
z[0] = 2052;
printf("y[0] = %d\t y[1] = %d\n", y[0], y[1]);  /* assume that we know we are compiling for a little-endian machine */
```

The JerryGen compiler only supports the `ArrayBuffer` type.  This means
that the Javascript programmer will not see any TypedArrays in WebIDL
APIs.  The reason for this is simplicity: it is trivial to convert an
`ArrayBuffer` to any typed array.  Further, any typed array has an
underlying `ArrayBuffer` array, so the Javascript programmer can pass
any typed array through to the C code, and the Jerryscript interpreter
will interpret the data as the underlying `ArrayBuffer`.

On the C side, `ArrayBuffer` is represented with a similar structure as
arrays, but with a `void` pointer instead of an explicit type.  Again,
this simplifies the interface: C programmers are well versed in
converting "`void *`" pointers to other kinds of pointer.

Note: TypedArrays must fit perfectly into an `ArrayBuffer` – *i.e.*, the
number of bytes in each element of a typed array must divide evenly into
the total size of the `ArrayBuffer`.  If this doesn't hold, the
interpreter will deliver an error message, as shown in the following
example:

``` syntaxhighlighter-pre
jerry> var x = new ArrayBuffer(10);       /* 10 bytes */
undefined
jerry> var y = new Int8Array(x);          /* 10 % 1 = 0 --> works */
undefined
jerry> var z = new Int16Array(x);         /* 10 % 2 = 0 --> works */
undefined
jerry> var a = new Int32Array(x);         /* 10 % 4 = 2 --> error! */    
Script Error: Error
jerry> 
```

Along with the usual interface for any array, `ArrayBuffers` come with
two extra calls – this is because we need to use malloc'd data when
dealing with `ArrayBuffers`, so the C programmer needs to be in control
to prevent memory leaks.  The two calls are shown below.

``` syntaxhighlighter-pre
/* write values from a C ArrayBuffer into a Javascript ArrayBuffer */
int ArrayBuffer_write(ArrayBuffer source, Interpreter_Type target);

/* read values from a Javascript ArrayBuffer into a C ArrayBuffer */
/* SIDE EFFECT: calls malloc */
int ArrayBuffer_read(Interpreter_Type source, ArrayBuffer target);
```

As an example, we'll define an API that exercises what a typical user
would do with an `ArrayBuffer`: we'll create an interface that stores an
`ArrayBuffer` and has a getter and a setter for that value, and we'll
show how to print out the contents.

``` syntaxhighlighter-pre
interface arraybuffer_interface {
    attribute ArrayBuffer arraybuffer_value;
    void set_arraybuffer_value(ArrayBuffer new_arraybuffer);
    ArrayBuffer get_arraybuffer_value();
    void print_arraybuffer(ArrayBuffer arraybuffer_param);
};
```

...we'll compile it with the following command – note the inclusion of
the `debug_printing` parameter, and we assume we're in the `examples`
directory in the main Jerryscript directory:

``` syntaxhighlighter-pre
../generate.js --debug_printing --output_utility_files --package=arraybuffer_interface arraybuffer_interface.idl
```

The `arraybuffer_interface_stubs.c` file will have three routines to
fill in, which we'll look at individually.  The first is the body for
the `set_arraybuffer_value` operation.  First, notice that the
`debug_printing` parameter has added parameter-printing code, protected
by the `DEBUG_PRINTING` variable (which can be found at the top of each
`*_stubs.c` file).  The `debug_printing` parameter tells JerryGen to add
code to each stub's body to print out the incoming parameters and the
return value.  Every type, both the intrinsic types and types created in
the WebIDL file, have a `debug_print_<type>` function created by
JerryGen.  (Note also that the current function does not return a value,
so there is nothing to print at the end of the function.)

Since this is the setter function for our interface, we need to take the
`ArrayBuffer` passed and copy it into the interface's attribute.  Each
attribute has an `insert_<interface>_<attribute>` function to do this
kind of thing – in this case, we are updating the `arraybuffer_value`
attribute, so we call `insert_arraybuffer_interface_arraybuffer_value`
to take the parameter and apply it to the interface.

``` syntaxhighlighter-pre
 
void arraybuffer_interface_set_arraybuffer_value_body(Interpreter_Type self, ArrayBuffer new_arraybuffer)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
                                           a call to Native_Object_get() if
                                           that call encounters an error */

    Native_Object_arraybuffer_interface *native_object = Native_Object_get(self, &arraybuffer_interface_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"set_arraybuffer_value\" :\n");
    debug_print_ArrayBuffer("new_arraybuffer", new_arraybuffer, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    insert_arraybuffer_interface_arraybuffer_value(self, new_arraybuffer);

}; /* arraybuffer_interface_set_arraybuffer_value_body */

```

Next, we can fill in the stub for the getter operation, which will
return the attribute stored in the interface.  Notice the debugging code
that gets inserted, here: the return value has a default value which
JerryGen inserts called `undefined_return_value` that is inserted so
that the code will compile even if the programmer doesn't fill in any of
the stubs' bodies.  During development, we found it very useful to be
able to compile stubs with, essentially, no functionality just to make
sure that parameters were getting passed in as expected – but C requires
that all functions that are declared to return a value actually do
return a value, so JerryGen puts in a dummy variable with a default
constructor (all types have a constructor created by JerryGen).

To modify this stub, we'll simply comment out the original declaration
and assignment of `undefined_return_value` and substitute a new
declaration using the "extract" function for the attribute.  (We keep
the name the same to minimize editing and make it obvious what we've
done.)  (We also move the return statement as a way to avoid the
inevitable error – if the `DEBUG_PRINTING` variable is set to 0, this
code will suddenly not compile, so this forestalls that eventuality.)

``` syntaxhighlighter-pre
ArrayBuffer arraybuffer_interface_get_arraybuffer_value_body(Interpreter_Type self)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
                                   a call to Native_Object_get() if
                       that call encounters an error */

    Native_Object_arraybuffer_interface *native_object = Native_Object_get(self, &arraybuffer_interface_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"get_arraybuffer_value\" :\n");
   printf("\tThe function \"get_arraybuffer_value\" takes no parameters.\n");
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    ArrayBuffer undefined_return_value = extract_arraybuffer_interface_arraybuffer_value(self);  /* <-- ADDED CODE */

#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code                       <-- NO LONGER TRUE
       without warnings */
    /*ArrayBuffer undefined_return_value = ArrayBuffer_constructor();                               <-- COMMENTED OUT! */
    debug_print_ArrayBuffer("RETURN_VALUE", undefined_return_value, 0);
    /*return undefined_return_value;                                                                <-- COMMENTED OUT! */
#endif /* DEBUG_PRINTING */

    return undefined_return_value;                                                               /* <-- ADDED CODE */
}; /* arraybuffer_interface_get_arraybuffer_value_body */
```

We will skip the `print_arraybuffer` function – because its job is to
print out the `ArrayBuffer` passed in and the debug routines already do
that, the code that JerryGen puts out already does what we need.

Now, the standard compilation command to produce an `a.out` file (assume
we have `cd`'d into the arraybuffer\_interface directory created by the
call to the generator).  Note that the Jerryscript libraries have been
built with the `ArrayBuffer` code turned on (the default settings for
compiling Jerryscript turn off the `ArrayBuffer` code; to turn it on,
create a .profile file like the one in the generator directory under the
`build_zephyr_idl` directory; then, compile the libraries adding the
following flag: "`–profile=.profile`" – for more information, consult
the
<a href="https://github.com/jerryscript-project/jerryscript/tree/master/jerry-core/profiles" class="external-link">Jerryscript documentation</a>).

``` syntaxhighlighter-pre
gcc -g --std=c99 -Djerry_value_has_error_flag=jerry_value_is_error -I../../jerry-port/default/include -I../../jerry-core/include -I../..//jerry-ext/include -I. -Ievents.md -Ibuffer.md -Iarraybuffer_interface ~/work/generator/unit_tests/template/main_jerrygen.c *.c ../../build/lib/libjerry-core.a ../../build/lib/libjerry-ext.a ../../build/lib/libjerry-port-default.a -lm
```

In the Javascript code below, we create an `ArrayBuffer`, create a
32-bit integer overlay for it, assign some values, and then pass the
`ArrayBuffer` into the constructor for a new `arraybuffer_interface`
object.

``` syntaxhighlighter-pre
var x = new ArrayBuffer(12);
var y = new Int32Array(x);
y[0] = 134481669;                        /* hex pattern: 0x08040705 */
y[1] = 84345864;                         /* hex pattern: 0x05070408 */
var ab1 = new arraybuffer_interface(x);
```

...printing ab1:

``` syntaxhighlighter-pre
ab1.print_arraybuffer(ab1.arraybuffer_value);
```

...produces:

``` syntaxhighlighter-pre
PARAMETERS TO "print_arraybuffer" :
   arraybuffer_param :  12
                       0x05  0x07  0x04  0x08  0x08  0x04  0x07  0x05
                       0x00  0x00  0x00  0x00  
undefined
```

...now, create a new `arraybuffer_interface` and then initialize it with
`ab1`'s ArrayBuffer:

``` syntaxhighlighter-pre
var ab2 = new arraybuffer_interface();
ab2.set_arraybuffer_value(ab1.get_arraybuffer_value());
```

...printing `ab2`'s buffer value:

``` syntaxhighlighter-pre
ab2.print_arraybuffer(ab2.arraybuffer_value);
```

...produces:

``` syntaxhighlighter-pre
PARAMETERS TO "print_arraybuffer" :
   arraybuffer_param :  12
                       0x05  0x07  0x04  0x08  0x08  0x04  0x07  0x05
                       0x00  0x00  0x00  0x00  
undefined
```

Now, adjust a parameter by creating an overlay and modifying it – notice
that we access the `ArrayBuffer` field (`arraybuffer_value`) itself
rather than calling `ab2.get_arraybuffer_value()`, as that returns a
copy of the `ArrayBuffer`.

``` syntaxhighlighter-pre
 var ab2_32 = new Int32Array(ab2.arraybuffer_value);
 ab2_32[0]++;
ab2.print_arraybuffer(ab2.get_arraybuffer_value());
```

...which produces:

``` syntaxhighlighter-pre
PARAMETERS TO "get_arraybuffer_value" :
        The function "get_arraybuffer_value" takes no parameters.
RETURN_VALUE :  12
               0x06  0x07  0x04  0x08  0x08  0x04  0x07  0x05
               0x00  0x00  0x00  0x00  
PARAMETERS TO "print_arraybuffer" :
   arraybuffer_param :  12
                       0x06  0x07  0x04  0x08  0x08  0x04  0x07  0x05
                       0x00  0x00  0x00  0x00  
undefined
```

#### Composite types

NOTE: for now, this section describes behavior gotten by using
Jerryscript's builtin parameter-type checking, which can be had by
including the "–arg\_handling=new" parameter when invoking the
generator.

Composite types are created with the parenthesized lists of types joined
with "or" as in the following example:

``` syntaxhighlighter-pre
definition composite_definition {
    (long or float) l_or_f_value;
};
```

For composite types, JerryGen creates a `.h` and `.c` pair of files with
a union type that encompasses all of the named types (any arbitrary list
of types joined by "or" can make up a composite type).  The union type's
name will be an alphabetized list of the types joined by "`_or_`".  For
the above example, the composite structure for a "`long_or_float`" will
be in `float_or_long.h` (notice the alphabetizing of the types!) and
look like this:

``` syntaxhighlighter-pre
typedef struct float_or_long_struct float_or_long;
struct float_or_long_struct {
    int union_type;
    union {
        float float_field;
        int32_t long_field;
    } value;
};
```

The `union_type` field for a type called `TYPE` will be a globally
visible constant value called `TYPE_uid`.  The uids of intrinsics can be
found in `webidl_compiler_utilities.h`, while all other types' uids can
be found in their respective `.h` files created by JerryGen.  (Of
course, because the naming scheme is defined, the user should never need
to look up the actual value but, rather, should just construct the name
themselves.)  For example, in the above example, getting a value from
the union type would require C code such as:

``` syntaxhighlighter-pre
foo(float_or_long x)
{
    if (x.union_type == float_uid)
        bar(x.float_field);
    else if (x.union_type == int32_t_uid)
        baz(x.long_field);
    else
        /* ERROR! */
} /* foo */
```

Multiple numeric types in a composite can be arbitrarily identified –
take, for example, the following definition in Javascript:

``` syntaxhighlighter-pre
var x = 1;
```

Remember that Javascript's type system for numeric values is: *number*.
 In C terms, this means that all values are stored as doubles,
regardless of their definition; it also means that translating the value
for x is arbitrary, as it could conceivably be translated into C as an
integer or as a float.  Further, although the boolean type in Javascript
is defined as a distinct primitive type, boolean values can be used
interchangeably with integers – consider the following Javascript:

``` syntaxhighlighter-pre
jerry> var x = true
jerry> typeof(x)
boolean
jerry> print(x)
true
jerry> print (1 + x)
2
```

This discussion brings up a fundamental problem with composite types:
how to specify a C type when translating from Javascript?  For example,
consider the following WebIDL:

``` syntaxhighlighter-pre
interface example {
    void foo( ( boolean or long or float ) x);
};
```

...and the corresponding Javascript usage:

``` syntaxhighlighter-pre
var first_example = new example;
first_example.foo(true);
first_example.foo(1);
first_example.foo(3.2);
```

...for this example, we'll assume our C stub simply prints out the value
passed to foo (the easiest way to get this behavior is by
including "–debug\_output" on our command line when compiling the
WebIDL).  When the above Javascript executes, we'll might see the
following output:

``` syntaxhighlighter-pre
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
```

...so what happened?  The default behavior of the parameter-checking
code from JerryGen is to allow coercion of types.  This is to make the
code more user friendly, as Javascript'ers are generally disinclined to
worry overmuch about the types they use, since Javascript tends to be
very forgiving/versatile.  For example, the following script:

``` syntaxhighlighter-pre
var string_example = new example;
string_example.foo("true");
string_example.foo("1");
string_example.foo("3.2");
```

...(despite all of the parameters being strings,) will produce:

``` syntaxhighlighter-pre
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
PARAMETERS TO "foo" :
   x with union type >boolean<:
       :  TRUE
```

...why does every call to foo seem to be with a boolean parameter?  To
understand this, we need to understand that booleans, strings, and
doubles are (semi) interchangeable primitive types in Javascript (note:
there is no other numeric type (like "long" or "int") in Javascript).
 Thus, a parameter with value "1" can be interpreted as either a true
boolean value or a double with value 1.0 – but which interpretation is
chosen is just a matter of which one we checked for first.  In the above
examples, JerryGen happened to put out the check for a boolean value
first, so it seems to always match on boolean – if the check for floats
had occurred first, the output would have looked like:

``` syntaxhighlighter-pre
PARAMETERS TO "foo" :
   x with union type >float<:
       :  1.000000
PARAMETERS TO "foo" :
   x with union type >float<:
       :  1.000000
PARAMETERS TO "foo" :
   x with union type >float<:
       :  3.200000
```

Clearly, neither answer is perfect; on one hand, we lose information
("3.2" becomes "1.0"), and on the other hand, we lose type precision
(booleans are represented as floating-point values).  (Also note that
all strings are interpreted by Jerryscript as true boolean
values, except for "", which is interpreted as a false value for a
boolean variable.)

There are three solutions for this conundrum:

1.  DEFAULT BEHAVIOR: JerryGen specifies the order of translation of
    numeric types.  We choose ease-of-use and data precision over type
    precision: the type checking of primitives is done in the following
    order: strings, then doubles, then floats, then integral types, and,
    finally, booleans.  This means that in the composite type in the
    first example, above, the first call is interpreted as having a
    boolean parameter, while the next two will always pass the parameter
    as a float value (b/c any value that could be matched as a float or
    long will match float first).
2.  STRICT TYPE CHECKING: JerryGen has settings to control strict type
    checking, so that, for example, a boolean value can only be true or
    false; to get this behavior, go into webidl\_compiler\_utilities.h,
    and change the value of the COERCION\_POLICY macro.  Like the
    default behavior, JerryGen still puts numeric values into the
    largest container it has (so a composite with only long and short
    numeric types will only ever fill in the long field). (Note that the
    original argument checking uses method \#2.)
3.  CONSTRUCT COMPOSITE TYPES CAREFULLY: The zephyr.js project's WebIDL,
    for example, only builds composite types out of types that aren't
    ambiguous: none of their WebIDL has a composite type that contains
    more than one numeric/boolean type. 

#### The "any" type

The any type is a composite of all of the WebIDL intrinsic types.

#### The "Json" type

For simplicity, the Json type is currently implemented as an alias for
the any type.

  

  

  

  

Document generated by Confluence on Feb 15, 2019 17:04

[Atlassian](http://www.atlassian.com/)

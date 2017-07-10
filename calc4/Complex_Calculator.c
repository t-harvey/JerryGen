/* AUTOMATICALLY GENERATED ON Mon Jul 10 2017 09:52:03 GMT-0500 (CDT) */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "jerryscript.h"
#include "calc4_Types.h"

jerry_value_t
create_Complex_Calculator_interface_handler(const jerry_value_t func_value,
		   const jerry_value_t this_val,
                   const jerry_value_t *args_p,
                   const jerry_length_t args_cnt);

// put all of the native-code functions (indentifable by the
// suffix "_handler") here:

static jerry_value_t
add_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    complex x = jerry_get_complex_value(args_p[0]);
    complex y = jerry_get_complex_value(args_p[1]);

extern complex Complex_Calculator_add_body(complex, complex, jerry_value_t);

    complex return_value = Complex_Calculator_add_body(x, y, this_val);

    return jerry_create_complex(return_value);

} /* add_handler */
/*
 *
 */
static jerry_value_t
add_and_print_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    complex x = jerry_get_complex_value(args_p[0]);
    complex y = jerry_get_complex_value(args_p[1]);
    PrintCallback1_calling_context print_it = (PrintCallback1_calling_context){args_p[2], this_val};

extern void Complex_Calculator_add_and_print_body(complex, complex, PrintCallback1_calling_context, jerry_value_t);

     Complex_Calculator_add_and_print_body(x, y, print_it, this_val);

    /* void return value */
    return jerry_create_undefined();

} /* add_and_print_handler */
/*
 *
 */
static jerry_value_t
subtract_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    complex x = jerry_get_complex_value(args_p[0]);
    complex y = jerry_get_complex_value(args_p[1]);

extern complex Complex_Calculator_subtract_body(complex, complex, jerry_value_t);

    complex return_value = Complex_Calculator_subtract_body(x, y, this_val);

    return jerry_create_complex(return_value);

} /* subtract_handler */
/*
 *
 */
static jerry_value_t
multiply_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    complex x = jerry_get_complex_value(args_p[0]);
    complex y = jerry_get_complex_value(args_p[1]);

extern complex Complex_Calculator_multiply_body(complex, complex, jerry_value_t);

    complex return_value = Complex_Calculator_multiply_body(x, y, this_val);

    return jerry_create_complex(return_value);

} /* multiply_handler */
/*
 *
 */
static jerry_value_t
divide_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    complex x = jerry_get_complex_value(args_p[0]);
    complex y = jerry_get_complex_value(args_p[1]);

extern complex Complex_Calculator_divide_body(complex, complex, jerry_value_t);

    complex return_value = Complex_Calculator_divide_body(x, y, this_val);

    return jerry_create_complex(return_value);

} /* divide_handler */
/*
 *
 */
static jerry_value_t
reflect_string_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    string x = jerry_get_string_value(args_p[0]);

extern string Complex_Calculator_reflect_string_body(string, jerry_value_t);

    string return_value_string = Complex_Calculator_reflect_string_body(x, this_val);
    jerry_value_t return_value = jerry_create_string((const jerry_char_t *)return_value_string);

     return return_value;

} /* reflect_string_handler */
/*
 *
 */


// we define types here, and marshalling/demarshalling methods of each type.
static void load_types_into_Jerryscript_environment()
{
    static bool already_called = false;

    if (already_called) return;
    else already_called = true;

    /* Create a JS object */
    const jerry_char_t my_js_object_unused_struct[] = " \
        function unused_struct(bob_parm) \
        { \
            this.bob = bob_parm; \
        }; \
      ";
    jerry_value_t my_js_obj_val_unused_struct;

    /* Evaluate script */
    my_js_obj_val_unused_struct = jerry_eval (my_js_object_unused_struct,
                              strlen ((const char *) my_js_object_unused_struct),
                              false);
    jerry_release_value(my_js_obj_val_unused_struct);
    /* Create a JS object */
    const jerry_char_t my_js_object_unused_struct2[] = " \
        function unused_struct2(bob_parm) \
        { \
            this.bob = bob_parm; \
        }; \
      ";
    jerry_value_t my_js_obj_val_unused_struct2;

    /* Evaluate script */
    my_js_obj_val_unused_struct2 = jerry_eval (my_js_object_unused_struct2,
                              strlen ((const char *) my_js_object_unused_struct2),
                              false);
    jerry_release_value(my_js_obj_val_unused_struct2);
    /* Create a JS object */
    const jerry_char_t my_js_object_complex[] = " \
        function complex(real_parm,imag_parm) \
        { \
            this.real = real_parm; \
            this.imag = imag_parm; \
        }; \
      ";
    jerry_value_t my_js_obj_val_complex;

    /* Evaluate script */
    my_js_obj_val_complex = jerry_eval (my_js_object_complex,
                              strlen ((const char *) my_js_object_complex),
                              false);
    jerry_release_value(my_js_obj_val_complex);
} /* load_types_into_Jerryscript_environment */

/* external declaration in calc4_Types.h */
jerry_value_t
create_Complex_Calculator_interface_handler(const jerry_value_t func_value,
		   const jerry_value_t this_val,
                   const jerry_value_t *args_p,
                   const jerry_length_t args_cnt)
{
    jerry_value_t new_Complex_Calculator = jerry_create_object();

    if ((((signed int)args_cnt)-1) >= 0)
    {
        jerry_value_t long_attribute_prop_name = jerry_create_string ((const jerry_char_t *) "long_attribute");
        jerry_set_property(new_Complex_Calculator, long_attribute_prop_name, args_p[0]);
        jerry_release_value(long_attribute_prop_name);
    }
    if ((((signed int)args_cnt)-1) >= 1)
    {
        jerry_value_t string_attribute_prop_name = jerry_create_string ((const jerry_char_t *) "string_attribute");
        jerry_set_property(new_Complex_Calculator, string_attribute_prop_name, args_p[1]);
        jerry_release_value(string_attribute_prop_name);
    }
    if ((((signed int)args_cnt)-1) >= 2)
    {
        jerry_value_t print_it_prop_name = jerry_create_string ((const jerry_char_t *) "print_it");
        jerry_set_property(new_Complex_Calculator, print_it_prop_name, args_p[2]);
        jerry_release_value(print_it_prop_name);
    }

    jerry_value_t prototype = get_prototype((char *)"Complex_Calculator");
    jerry_set_prototype(new_Complex_Calculator, prototype);
    jerry_release_value(prototype);

    return new_Complex_Calculator;
} /* create_Complex_Calculator_interface_handler */


void load_Complex_Calculator_interface(void)
{
    load_types_into_Jerryscript_environment();


    jerry_value_t global_object = jerry_get_global_object();

    /* add all of the interface prototypes */
    jerry_value_t Complex_Calculator_prototype_object = jerry_create_object();
    register_function_call(Complex_Calculator_prototype_object,
                           "add", &add_handler);
    register_function_call(Complex_Calculator_prototype_object,
                           "add_and_print", &add_and_print_handler);
    register_function_call(Complex_Calculator_prototype_object,
                           "subtract", &subtract_handler);
    register_function_call(Complex_Calculator_prototype_object,
                           "multiply", &multiply_handler);
    register_function_call(Complex_Calculator_prototype_object,
                           "divide", &divide_handler);
    register_function_call(Complex_Calculator_prototype_object,
                           "reflect_string", &reflect_string_handler);

    register_prototype((char *)"Complex_Calculator", Complex_Calculator_prototype_object);
    jerry_release_value(Complex_Calculator_prototype_object);

    register_function_call(global_object, "Complex_Calculator", &create_Complex_Calculator_interface_handler);

    jerry_release_value(global_object);

} /* load_Complex_Calculator_interface */


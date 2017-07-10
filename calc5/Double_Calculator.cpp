/* AUTOMATICALLY GENERATED ON Wed Jun 28 2017 13:12:41 GMT-0500 (CDT) */

#include <stdio.h>
#include <stdlib.h>

#include "jerryscript.h"
#include "calc5_Types.h"

jerry_value_t
create_Double_Calculator_interface_handler(const jerry_value_t func_value,
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
    double x = jerry_get_double_value(args_p[0]);
    double y = jerry_get_double_value(args_p[1]);

extern double Double_Calculator_add_body(double, double);

    double return_value = Double_Calculator_add_body(x, y);

    return jerry_create_number(return_value);

} /* add_handler */
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
    double x = jerry_get_double_value(args_p[0]);
    double y = jerry_get_double_value(args_p[1]);

extern double Double_Calculator_subtract_body(double, double);

    double return_value = Double_Calculator_subtract_body(x, y);

    return jerry_create_number(return_value);

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
    double x = jerry_get_double_value(args_p[0]);
    double y = jerry_get_double_value(args_p[1]);

extern double Double_Calculator_multiply_body(double, double);

    double return_value = Double_Calculator_multiply_body(x, y);

    return jerry_create_number(return_value);

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
    double x = jerry_get_double_value(args_p[0]);
    double y = jerry_get_double_value(args_p[1]);

extern double Double_Calculator_divide_body(double, double);

    double return_value = Double_Calculator_divide_body(x, y);

    return jerry_create_number(return_value);

} /* divide_handler */
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

/* external declaration in calc5_Types.h */
jerry_value_t
create_Double_Calculator_interface_handler(const jerry_value_t func_value,
		   const jerry_value_t this_val,
                   const jerry_value_t *args_p,
                   const jerry_length_t args_cnt)
{
    jerry_value_t new_Double_Calculator = jerry_create_object();


    jerry_value_t prototype = get_prototype((char *)"Double_Calculator");
    jerry_set_prototype(new_Double_Calculator, prototype);
    jerry_release_value(prototype);

    return new_Double_Calculator;
} /* create_Double_Calculator_interface_handler */


void load_Double_Calculator_interface(void)
{
    load_types_into_Jerryscript_environment();


    jerry_value_t global_object = jerry_get_global_object();

    /* add all of the interface prototypes */
    jerry_value_t Double_Calculator_prototype_object = jerry_create_object();
    register_function_call(Double_Calculator_prototype_object,
                           "add", &add_handler);
    register_function_call(Double_Calculator_prototype_object,
                           "subtract", &subtract_handler);
    register_function_call(Double_Calculator_prototype_object,
                           "multiply", &multiply_handler);
    register_function_call(Double_Calculator_prototype_object,
                           "divide", &divide_handler);

    register_prototype((char *)"Double_Calculator", Double_Calculator_prototype_object);
    jerry_release_value(Double_Calculator_prototype_object);

    register_function_call(global_object, "Double_Calculator", &create_Double_Calculator_interface_handler);

    jerry_release_value(global_object);

} /* load_Double_Calculator_interface */


/* AUTOMATICALLY GENERATED ON Wed Jun 28 2017 13:12:41 GMT-0500 (CDT) */

#include <stdio.h>
#include <stdlib.h>

#include "jerryscript.h"
#include "calc5_Types.h"


// put all of the native-code functions (indentifable by the
// suffix "_handler") here:

static jerry_value_t
add_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments
    int32_t x = jerry_get_int32_t_value(args_p[0]);
    int32_t y = jerry_get_int32_t_value(args_p[1]);

extern int32_t Long_Calculator_no_interface_add_body(int32_t, int32_t);

    int32_t return_value = Long_Calculator_no_interface_add_body(x, y);

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
    int32_t x = jerry_get_int32_t_value(args_p[0]);
    int32_t y = jerry_get_int32_t_value(args_p[1]);

extern int32_t Long_Calculator_no_interface_subtract_body(int32_t, int32_t);

    int32_t return_value = Long_Calculator_no_interface_subtract_body(x, y);

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
    int32_t x = jerry_get_int32_t_value(args_p[0]);
    int32_t y = jerry_get_int32_t_value(args_p[1]);

extern int32_t Long_Calculator_no_interface_multiply_body(int32_t, int32_t);

    int32_t return_value = Long_Calculator_no_interface_multiply_body(x, y);

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
    int32_t x = jerry_get_int32_t_value(args_p[0]);
    int32_t y = jerry_get_int32_t_value(args_p[1]);

extern int32_t Long_Calculator_no_interface_divide_body(int32_t, int32_t);

    int32_t return_value = Long_Calculator_no_interface_divide_body(x, y);

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
create_Long_Calculator_no_interface_interface_handler(const jerry_value_t func_value,
		   const jerry_value_t this_val,
                   const jerry_value_t *args_p,
                   const jerry_length_t args_cnt)
{
    jerry_value_t object_name = jerry_create_string((const jerry_char_t *) "Long_Calculator_no_interface");
    jerry_value_t global_object = jerry_get_global_object();
    jerry_value_t object = jerry_get_property(global_object, object_name);
    jerry_release_value(object_name);
    jerry_release_value(global_object);
    return object;
} /* create_Long_Calculator_no_interface_interface_handler */


void load_Long_Calculator_no_interface_interface(void)
{
    load_types_into_Jerryscript_environment();


    jerry_value_t global_object = jerry_get_global_object();

    /* add all of the interface prototypes */
    jerry_value_t Long_Calculator_no_interface_prototype_object = jerry_create_object();
    register_function_call(Long_Calculator_no_interface_prototype_object,
                           "add", &add_handler);
    register_function_call(Long_Calculator_no_interface_prototype_object,
                           "subtract", &subtract_handler);
    register_function_call(Long_Calculator_no_interface_prototype_object,
                           "multiply", &multiply_handler);
    register_function_call(Long_Calculator_no_interface_prototype_object,
                           "divide", &divide_handler);

    jerry_value_t object_name = jerry_create_string((const jerry_char_t *) "Long_Calculator_no_interface");
    jerry_value_t throwaway = jerry_set_property(global_object,
						object_name,
						Long_Calculator_no_interface_prototype_object);
    jerry_release_value(throwaway);
    jerry_release_value(Long_Calculator_no_interface_prototype_object);

    jerry_release_value(global_object);

} /* load_Long_Calculator_no_interface_interface */


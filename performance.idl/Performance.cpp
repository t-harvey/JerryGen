{/}} construct, so we wrap this entire script with a name
    that shouldn't(!) be in the input file }}
/* AUTOMATICALLY GENERATED ON Thu May 11 2017 16:36:12 GMT-0500 (CDT) */

#include <stdio.h>
#include <stdlib.h>

#include "jerry-api.h"

// If the user has dictionary types, we'll do all of the #includes
// there, and we'll get them for free when we include the .h file for the
// dictionaries; but if they didn't add any dictionaries, we need to
// ensure that the .c file gets the necessary #includes

/*#include "jerry-port.h"*/
/*#include "jerry-port-default.h"*/


// put all of the native-code functions (indentifable by the
// suffix "_handler") here:

static jerry_value_t
now_handler(const jerry_value_t func_value, /**< function object */
		   const jerry_value_t this_val, /**< this arg */
                   const jerry_value_t *args_p, /**< function arguments */
                   const jerry_length_t args_cnt) /**< number of function arguments */
{
    // demarshal the arguments

extern double Performance_now_body();

double return_value = Performance_now_body();


    return jerry_create_number(return_value);
    
} /* now_handler */
/*
 *
 */

static void register_function_call(jerry_value_t enclosing_object,
				   const char *function_name,
       			           jerry_external_handler_t handler)
{
  /* Create a JS function object and wrap into a jerry value */
  jerry_value_t function_object = jerry_create_external_function(handler);

  /* Set the native function as a property of the enclosing object
     (either the global object, or a user-define object) */
  jerry_value_t prop_name =
                 jerry_create_string((const jerry_char_t *) function_name);
  jerry_set_property(enclosing_object, prop_name, function_object);
  jerry_release_value(function_object);
  jerry_release_value(prop_name);
} /* register_function_call */

// we define types here, and marshalling/demarshalling methods of each type.
static void load_types_into_Jerryscript_environment()
{
    static bool already_called = false;

    if (already_called) return;
    else already_called = true;

} /* load_types_into_Jerryscript_environment */





void load_Performance_interface(void)
{
    load_types_into_Jerryscript_environment();


    jerry_value_t global_object = jerry_get_global_object();
    register_function_call(global_object, "now", &now_handler);
    jerry_release_value(global_object);

} /* load_Performance_interface */


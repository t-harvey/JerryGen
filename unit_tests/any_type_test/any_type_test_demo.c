/* AUTOMATICALLY GENERATED ON Fri Feb 17 2017 09:43:21 GMT-0600 (CST) */

//std
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "jerryscript.h"
#include "jerryscript-ext/handler.h"
#include "jerryscript-port.h"
#include "jerryscript-port-default.h"


#include "webidl_compiler_utilities.h"

#define _STRINGIFY(s...) #s
#define STRINGIFY(s...) _STRINGIFY(s)


/**
 * Register a JavaScript function in the global object.
 */
static void
register_js_function (const char *name_p, /**< name of the function */
                      jerry_external_handler_t handler_p) /**< function callback */
{
  jerry_value_t result_val = jerryx_handler_register_global ((const jerry_char_t *) name_p, handler_p);

  if (jerry_value_has_error_flag (result_val))
  {
    jerry_port_log (JERRY_LOG_LEVEL_WARNING, "Warning: failed to register '%s' method.", name_p);
    //print_unhandled_exception (result_val);
  }

  jerry_release_value (result_val);
} /* register_js_function */


static jerry_value_t evaluate_script(jerry_char_t jerry_script[])
{
    size_t jerry_script_size = strlen ((const char *) jerry_script);
    jerry_value_t eval_ret = jerry_eval (jerry_script, jerry_script_size, false);
    if (jerry_value_has_error_flag (eval_ret))
    {
	fprintf(stderr, "ERROR parsing script!\n");
	fprintf(stderr, "\t>%s<\n", (const char *)jerry_script);
    }
    return eval_ret;
} /* evaluate_script */


int main()
{
  /* Initialize engine */
  jerry_init (JERRY_INIT_EMPTY);
    register_js_function ("assert", jerryx_handler_assert);
    register_js_function ("gc", jerryx_handler_gc);
    register_js_function ("print", jerryx_handler_print);

  /* set up language extensions */
    initialize_all_webidl_constructs();

    /* test the code */
  jerry_value_t return_value;

  jerry_char_t get_new_any_type[] = STRINGIFY(
		    var anything = new any_type_test();

		    var int81 = 1;
		    var int82 = 2;
		    var int8_sum = anything.do_something("BYTE_T", int81, "BYTE_T", int82);
		    print("sum of int8s "+ int81 + " and " + int82 + " = " + int8_sum + "\n");
		    
		    var bool_value1 = (10 > 9);
		    var bool_value2 = (10 > 9);
		    var boolean_and = anything.do_something("BOOLEAN_T", bool_value1, "BOOLEAN_T", bool_value2);
		    print("and of boolean values " + bool_value1 + " and " + bool_value2 + " = " + boolean_and + "\n");
		    var string1 = "this";
		    var string2 = "and this";
		    var concatenation = anything.do_something("STRING_T", string1, "STRING_T", string2);
		    print("concatention of \"" + string1 + "\" and \"" + string2 + "\" = \"" + concatenation + "\"" + "\n");
		    var float_1 = 1.5;
		    var float_2 = 2.3;
		    var float_sum = anything.do_something("FLOAT_T", float_1, "FLOAT_T", float_2);
		    print("sum of floats " + float_1 + " and " + float_2 + " = " + float_sum);
	       );
  if (jerry_value_has_error_flag(evaluate_script(get_new_any_type)))
	fprintf(stdout, "ERROR!!!\n");

    jerry_cleanup();

} /* main */

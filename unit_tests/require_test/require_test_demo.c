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

  if (jerry_value_is_error (result_val))
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
    if (jerry_value_is_error (eval_ret))
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

    /* this should fail... */
    jerry_char_t get_new_bob[] = STRINGIFY(
					   var new_bob = new bob;
			         );
    return_value = evaluate_script(get_new_bob);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "New failed (correctly so).\n");
    else
	fprintf(stdout, "ERROR!!!\n");
    jerry_release_value(return_value);
  
  
    /* this should produce no error... */
    jerry_char_t get_require_bob[] = STRINGIFY(
					       var new_bob = require("bob");
				     );
    return_value = evaluate_script(get_require_bob);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!\n");
    else
	fprintf(stdout, "Require worked.\n");
    jerry_release_value(return_value);

    jerry_cleanup();

} /* main */

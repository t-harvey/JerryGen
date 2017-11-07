/* AUTOMATICALLY GENERATED ON Fri Feb 17 2017 09:43:21 GMT-0600 (CST) */

// user
//
//#include "PPRPCGEN_bobTypes.h"
//

//
//#include "PPRPCGEN_Calculator.h"
//

//std
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "jerryscript.h"
#include "jerryscript-ext/handler.h"
#include "jerryscript-port.h"
#include "jerryscript-port-default.h"


#include "separate4_Types.h"

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
    //    ecma_string_t *my_pointer = jerry_global_heap+6608;

  /* set up language extensions */
    load_all_separate4_members();

    /* test the code */
  jerry_value_t return_value;

  jerry_char_t get_new_complex[] = STRINGIFY(
		    var sep1 = new separate1(0, 1);
		    var sep2 = new separate2(sep1, 3);
		    var sep3 = new separate3(sep1, sep2, 7);
		    var sep4 = new separate4(sep3, 15);
		    var sep_interface = new separate_interface;

		    sep_interface.show_object(1, 2, sep4);
	       );
  if (jerry_value_has_error_flag(evaluate_script(get_new_complex)))
	fprintf(stdout, "ERROR!!!\n");

    jerry_cleanup();

} /* main */

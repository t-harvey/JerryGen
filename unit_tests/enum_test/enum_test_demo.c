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

#include "enum_holder.h"

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

    jerry_char_t debug_print_enum[] = STRINGIFY(

		    /* first, create the dictionaries */
		    var enum_holder1 = new enum_holder; /* default init */
		    var enum_holder2 = new enum_holder("ENUM_TWO");

		    /* second, create the interface that holds the empty
		       function that will use the debugging printer
		       embedded within */
		    var printer = new enum_printer;

 		    /* finally, print the values */
 		    printer.debug_print_it(enum_holder1);
 		    printer.debug_print_it(enum_holder2);
     ); /* Javascript test code */

     if (jerry_value_is_error(evaluate_script(debug_print_enum)))
 	fprintf(stdout, "ERROR!!!\n");

    /* now, assign a value to a Javascript variable and then print it out */
    jerry_char_t reassign_enum_value[] = STRINGIFY(enum_holder1;);
    jerry_value_t enum_holder1_value_t = evaluate_script(reassign_enum_value);
    if (jerry_value_is_error(enum_holder1_value_t))
	fprintf(stdout, "ERROR!!!\n");
    else
    {
	 enum_holder enum_holder1_in_C =
	               interpreter_get_enum_holder_value(enum_holder1_value_t);
	 enum_holder1_in_C.enum_value += 2;
	 jerry_value_t new_holder = interpreter_create_enum_holder(enum_holder1_in_C);
	 jerry_value_t global_object = jerry_get_global_object();
	 Interpreter_Type enum_value_prop_name =
	            jerry_create_string((const jerry_char_t *) "enum_holder3");
	 jerry_release_value(jerry_set_property(global_object,
						enum_value_prop_name,
						new_holder));

	 jerry_char_t print_out_holder3[] = STRINGIFY(
				        printer.debug_print_it(enum_holder3);
					    );
	 if (jerry_value_is_error(evaluate_script(print_out_holder3)))
	     fprintf(stdout, "ERROR!!!\n");
    }

     printf("CLEANING UP\n");
     jerry_cleanup();

} /* main */

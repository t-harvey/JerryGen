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


static string boolean_print(bool value)
{
    return value?"TRUE":"FALSE";
}/* boolean_print */


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

    /* we'll create some variables of each WebIDL construct and test them;
       after that, we'll build composite types and experiment with them */

#include "Enum1.h"
    jerry_char_t enums_script[] = STRINGIFY(
				       var enum1 = "EnumString1";
				       var not_either_enum = "NotEnumString";
			         );
    return_value = evaluate_script(enums_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in enum definition\n");
    jerry_release_value(return_value);
    jerry_char_t get_enum1[] = STRINGIFY( enum1; );
    jerry_value_t enum1_value = evaluate_script(get_enum1);
    jerry_char_t get_not_either[] = STRINGIFY( not_either_enum; );
    jerry_value_t not_either_enum_value = evaluate_script(get_not_either);
    
    fprintf(stdout, "enum1 is of type Enum1:\t\t\t%s\n", boolean_print(interpreter_value_is_Enum1(enum1_value)));

    fprintf(stdout, "not_either_enum is of type Enum1:\t%s\n", boolean_print(interpreter_value_is_Enum1(not_either_enum_value)));
jerry_release_value(not_either_enum_value);

    fprintf(stdout, "\n");

#include "Dictionary1.h"
    jerry_char_t dictionaries_script[] = STRINGIFY(
		var dict1 = new Dictionary1(["EnumString3",  "EnumString1", "EnumString2"]) ;

		var dict1_from_scratch = new Object;
		dict1_from_scratch.enum_array_field = [];
		dict1_from_scratch.enum_array_field.push("EnumString2");
		dict1_from_scratch.enum_array_field.push("EnumString3");
		dict1_from_scratch.enum_array_field.push("EnumString1");
			         );
    return_value = evaluate_script(dictionaries_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in dictionary definition\n");
    jerry_release_value(return_value);

    jerry_char_t get_dict1[] = STRINGIFY( dict1; ); 
    jerry_value_t dict1_value = evaluate_script(get_dict1);
    jerry_char_t get_dict1_from_scratch[] = STRINGIFY( dict1_from_scratch; ); 
    jerry_value_t dict1_from_scratch_value = evaluate_script(get_dict1_from_scratch);

    fprintf(stdout, "\ndict1 is of type Dictionary1: \t\t\t%s\n", boolean_print(interpreter_value_is_Dictionary1(dict1_value)));
    debug_print_Dictionary1("dict1", interpreter_get_Dictionary1_value(dict1_value), 3);

    fprintf(stdout, "dict1_from_scratch is of type Dictionary1: \t%s\n", boolean_print(interpreter_value_is_Dictionary1(dict1_from_scratch_value)));

#include "Interface1.h"
    jerry_char_t interfaces_script[] = STRINGIFY(
		var interface1 = new Interface1([1, 2, 3], dict1_from_scratch);

		var interface1_from_scratch = new Object;
		interface1_from_scratch.long_array = [4, 5, 6];
		interface1_from_scratch.dictionary1_array = dict1;
		interface1_from_scratch.interface_function1 =
		    function(random_number, d_a, e_a, l_or_d_a)
		    {
			print("random_number: " + random_number);
			print("d_a: ");
			for(var i = 0; i< d_a.length; i++)
			    print("    " + d_a[i]);
			print("e_a: ");
			for(var i = 0; i< e_a.length; i++)
			    print("    " + e_a[i]);
			print("l_or_d_a: ");
			for(var i = 0; i< l_or_d_a.length; i++)
			    print("    " + l_or_d_a[i]);
		    }; /* interface_function1 */
						 );
    return_value = evaluate_script(interfaces_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in interface definition\n");
    jerry_release_value(return_value);

    jerry_char_t get_interface1[] = STRINGIFY( interface1; ); 
    jerry_value_t interface1_value = evaluate_script(get_interface1);
    jerry_char_t get_interface1_from_scratch[] =
	                         STRINGIFY( interface1_from_scratch; ); 
    jerry_value_t interface1_from_scratch_value =
	                         evaluate_script(get_interface1_from_scratch);

    fprintf(stdout, "\ninterface1 is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface1_value))); 

    fprintf(stdout, "interface1_from_scratch is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface1_from_scratch_value))); 


    fprintf(stdout, "calling interface1_from_scratch.interface_function1:\n");
    jerry_char_t call_functions_script[] = STRINGIFY(
		interface1_from_scratch.interface_function1(4, [dict1], ["EnumString1"], [1, 2, 3]);
		interface1.interface_function1(5, [dict1], ["EnumString1"], [1, 2, dict1, 3]);
						 );
    return_value = evaluate_script(call_functions_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in calling the functions\n");
    jerry_release_value(return_value);
    

    jerry_cleanup();

} /* main */

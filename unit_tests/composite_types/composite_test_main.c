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


#include "webidl_compiler_utilities_private.h"

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

#include "Enum1_private.h"
#include "Enum2_private.h"
    jerry_char_t enums_script[] = STRINGIFY(
				       var enum1 = "EnumString1";
				       var enum2 = "EnumString1a";
				       var not_either_enum = "NotEnumString";
			         );
    return_value = evaluate_script(enums_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in enum definition\n");
    jerry_release_value(return_value);
    jerry_char_t get_enum1[] = STRINGIFY( enum1; );
    jerry_value_t enum1_value = evaluate_script(get_enum1);
    jerry_char_t get_enum2[] = STRINGIFY( enum2; );
    jerry_value_t enum2_value = evaluate_script(get_enum2);
    jerry_char_t get_not_either[] = STRINGIFY( not_either_enum; );
    jerry_value_t not_either_enum_value = evaluate_script(get_not_either);
    
    fprintf(stdout, "enum1 is of type Enum1:\t\t\t%s\n", boolean_print(interpreter_value_is_Enum1(enum1_value)));
    fprintf(stdout, "\tenum1 is of type Enum2:\t\t  %s\n", boolean_print(interpreter_value_is_Enum2(enum1_value)));

    fprintf(stdout, "enum2 is of type Enum1:\t\t\t%s\n", boolean_print(interpreter_value_is_Enum1(enum2_value)));
    fprintf(stdout, "\tenum2 is of type Enum2:\t\t  %s\n", boolean_print(interpreter_value_is_Enum2(enum2_value)));
jerry_release_value(enum2_value);

    fprintf(stdout, "not_either_enum is of type Enum1:\t%s\n", boolean_print(interpreter_value_is_Enum1(not_either_enum_value)));
    fprintf(stdout, "\tnot_either_enum is of type Enum2: %s\n", boolean_print(interpreter_value_is_Enum2(not_either_enum_value)));
jerry_release_value(not_either_enum_value);

    fprintf(stdout, "\n");

#include "Callback1_private.h"
#include "Callback2_private.h"
#include "Callback3_private.h"
    jerry_char_t callbacks_script[] = STRINGIFY(
		var callback1 = function(float_argument)
		    {
			print("callback 1, float_argument = " +
			       float_argument); return 1;
		    }; /* callback1 */
		var callback2 = function(string_argument)
		    {
			print("callback 2, string_argument = " +
			       string_argument);
			return 2;
		    }; /* callback2 */
		var callback3 = function(float_argument, string_argument)
		    {
			print("callback 3, float_argument = " +
			      float_argument +
			      "     string_argument = " +
			      string_argument); 
			return 3;
		    }; /* callback3 */
			         );
    return_value = evaluate_script(callbacks_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in callback definition\n");
    jerry_release_value(return_value);
    jerry_char_t get_callback1[] = STRINGIFY( callback1; ); 
    jerry_value_t callback1_value = evaluate_script(get_callback1);
    jerry_char_t get_callback2[] = STRINGIFY( callback2; ); 
    jerry_value_t callback2_value = evaluate_script(get_callback2);
    jerry_char_t get_callback3[] = STRINGIFY( callback3; ); 
    jerry_value_t callback3_value = evaluate_script(get_callback3);

    fprintf(stdout, "callback1 is of type Enum1:\t%s\n", boolean_print(interpreter_value_is_Enum1(callback1_value)));
    fprintf(stdout, "enum1 is of type Callback1:\t%s\n\n", boolean_print(interpreter_value_is_Callback1(enum1_value)));

jerry_release_value(enum1_value);

    fprintf(stdout, "callback1 is of type Callback1: \t%s\n", boolean_print(interpreter_value_is_Callback1(callback1_value)));
    fprintf(stdout, "\tcallback1 is of type Callback2: %s\n", boolean_print(interpreter_value_is_Callback2(callback1_value)));
    fprintf(stdout, "\tcallback1 is of type Callback3: %s\n", boolean_print(interpreter_value_is_Callback3(callback1_value)));
jerry_release_value(callback1_value);

    fprintf(stdout, "callback2 is of type Callback1: \t%s\n", boolean_print(interpreter_value_is_Callback1(callback2_value)));
    fprintf(stdout, "\tcallback2 is of type Callback2: %s\n", boolean_print(interpreter_value_is_Callback2(callback2_value)));
    fprintf(stdout, "\tcallback2 is of type Callback3: %s\n", boolean_print(interpreter_value_is_Callback3(callback2_value)));
jerry_release_value(callback2_value);

    fprintf(stdout, "callback3 is of type Callback1: \t%s\n", boolean_print(interpreter_value_is_Callback1(callback3_value)));
    fprintf(stdout, "\tcallback3 is of type Callback2: %s\n", boolean_print(interpreter_value_is_Callback2(callback3_value)));
    fprintf(stdout, "\tcallback3 is of type Callback3: %s\n", boolean_print(interpreter_value_is_Callback3(callback3_value)));
jerry_release_value(callback3_value);

#include "Dictionary1_private.h"
#include "Dictionary2_private.h"
    jerry_char_t dictionaries_script[] = STRINGIFY(
		var dict1 = new Dictionary1(1.0, 1, callback1) ;
		var dict2 = new Dictionary2;

		var dict12_from_scratch = new Object;
		dict12_from_scratch.float_field = 1.0;
		dict12_from_scratch.long_field = 2;
		dict12_from_scratch.interface_function1 = callback3;
		dict12_from_scratch.interface_function2 = callback1;
			         );
    return_value = evaluate_script(dictionaries_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in dictionary definition\n");
    jerry_release_value(return_value);

    jerry_char_t get_dict1[] = STRINGIFY( dict1; ); 
    jerry_value_t dict1_value = evaluate_script(get_dict1);
    jerry_char_t get_dict2[] = STRINGIFY( dict2; ); 
    jerry_value_t dict2_value = evaluate_script(get_dict2);
    jerry_char_t get_dict12[] = STRINGIFY( dict12_from_scratch; ); 
    jerry_value_t dict12_value = evaluate_script(get_dict12);

    fprintf(stdout, "\ndict1 is of type Dictionary1: \t\t\t%s\n", boolean_print(interpreter_value_is_Dictionary1(dict1_value)));
    fprintf(stdout, "\tdict1 is of type Dictionary2: \t\t%s\n", boolean_print(interpreter_value_is_Dictionary2(dict1_value)));
jerry_release_value(dict1_value);

    fprintf(stdout, "dict2 is of type Dictionary1: \t\t\t%s\n", boolean_print(interpreter_value_is_Dictionary1(dict2_value)));
    fprintf(stdout, "\tdict2 is of type Dictionary2: \t\t%s\n", boolean_print(interpreter_value_is_Dictionary2(dict2_value)));
jerry_release_value(dict2_value);

    fprintf(stdout, "dict12_from_scratch is of type Dictionary1: \t%s\n", boolean_print(interpreter_value_is_Dictionary1(dict12_value)));
    fprintf(stdout, "dict12_from_scratch is of type Dictionary2: \t%s\n", boolean_print(interpreter_value_is_Dictionary2(dict12_value)));
jerry_release_value(dict12_value);

#include "Interface1_private.h"
#include "Interface2_private.h"
#include "Interface3_private.h"
    jerry_char_t interfaces_script[] = STRINGIFY(
		var interface1 = new Interface1(1, 1.0, callback3);
		var interface2 = new Interface2;
		var interface3 = new Interface3;

		var interface12_from_scratch = new Object;
		interface12_from_scratch.float_attribute = 1.0;
		interface12_from_scratch.long_attribute = 2;
		interface12_from_scratch.interface_function1 = callback3;
		interface12_from_scratch.interface_function2 = callback1;
			         );
    return_value = evaluate_script(interfaces_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in interface definition\n");
    jerry_release_value(return_value);

    jerry_char_t get_interface1[] = STRINGIFY( interface1; ); 
    jerry_value_t interface1_value = evaluate_script(get_interface1);
    jerry_char_t get_interface2[] = STRINGIFY( interface2; ); 
    jerry_value_t interface2_value = evaluate_script(get_interface2);
    jerry_char_t get_interface3[] = STRINGIFY( interface3; ); 
    jerry_value_t interface3_value = evaluate_script(get_interface3);
    jerry_char_t get_interface12[] = STRINGIFY( interface12_from_scratch; ); 
    jerry_value_t interface12_value = evaluate_script(get_interface12);

    fprintf(stdout, "\ninterface1 is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface1_value))); 
    fprintf(stdout, "\tinterface1 is of type Interface2: \t%s\n", boolean_print(interpreter_value_is_Interface2(interface1_value))); 
    fprintf(stdout, "\tinterface1 is of type Interface3: \t%s\n", boolean_print(interpreter_value_is_Interface3(interface1_value))); 
jerry_release_value(interface1_value);

    fprintf(stdout, "interface2 is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface2_value))); 
    fprintf(stdout, "\tinterface2 is of type Interface2: \t%s\n", boolean_print(interpreter_value_is_Interface2(interface2_value))); 
    fprintf(stdout, "\tinterface2 is of type Interface3: \t%s\n", boolean_print(interpreter_value_is_Interface3(interface2_value))); 
jerry_release_value(interface2_value);

    fprintf(stdout, "interface3 is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface3_value))); 
    fprintf(stdout, "\tinterface3 is of type Interface2: \t%s\n", boolean_print(interpreter_value_is_Interface2(interface3_value))); 
    fprintf(stdout, "\tinterface3 is of type Interface3: \t%s\n", boolean_print(interpreter_value_is_Interface3(interface3_value))); 
jerry_release_value(interface3_value);

    fprintf(stdout, "interface12 is of type Interface1: \t\t%s\n", boolean_print(interpreter_value_is_Interface1(interface12_value))); 
    fprintf(stdout, "\tinterface12 is of type Interface2: \t%s\n", boolean_print(interpreter_value_is_Interface2(interface12_value))); 
    fprintf(stdout, "\tinterface12 is of type Interface3: \t%s\n", boolean_print(interpreter_value_is_Interface3(interface12_value))); 
jerry_release_value(interface12_value);
    
fprintf(stdout, "**************** COMPOSITE TYPES ********************\n");


    jerry_char_t composites_script1[] = STRINGIFY(
				    var int1 = Interface1(-1, -2.0);
				    var int4 = new Interface4;
                                 );
    jerry_char_t composites_script2[] = STRINGIFY(
		      print("FIRST! CALL (with '1' and 'bob' as parameters) :");
		      int4.interface4_function1(1, "bob");
				 );

    jerry_char_t composites_script3[] = STRINGIFY(
       print("SECOND CALL (with interface1(-1, -2.0) and 1.0 as parameters) :");
       int4.interface4_function1(int1, 1.0);
			         );
    return_value = evaluate_script(composites_script1);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in composites_script1\n");
    jerry_release_value(return_value);
    return_value = evaluate_script(composites_script2);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in composites_script2\n");
    jerry_release_value(return_value);
    return_value = evaluate_script(composites_script3);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in composites_script3\n");
    jerry_release_value(return_value);

    jerry_char_t nested_composites_script[] = STRINGIFY(
			        var check_nested = new check_nested_composites;
				print("Explicitly Nested: 1.0");
				check_nested.show_explicitly_nested(1.0);
				print("Explicitly Nested: 'bob'");
				check_nested.show_explicitly_nested("bob");
				print("Explicitly Nested: 2");
				check_nested.show_explicitly_nested(2);
				print("Explicitly Nested: true");
				check_nested.show_explicitly_nested(true);
				check_nested.show_nested_dictionaries({composite_of_composites_field: {single_composite_field: 1}});
				check_nested.show_nested_dictionaries(1);
				);
    return_value = evaluate_script(nested_composites_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in nested-composites-script\n");
    jerry_release_value(return_value);

    jerry_char_t really_big_composites_script[] = STRINGIFY(
			       var check_big = new check_really_big_composites;
			       check_big.foo(1);
			       check_big.foo("bob");
			       check_big.foo(true);
			       check_big.foo("EnumString1");
							);
    return_value = evaluate_script(really_big_composites_script);
    if (jerry_value_is_error(return_value))
	fprintf(stdout, "ERROR!!!...in really-big-composites-script\n");
    jerry_release_value(return_value);

    jerry_cleanup();

} /* main */

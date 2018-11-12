
#include "webidl_compiler_utilities.h"
#include "simple_interface.h"
#include "simple_interface_stubs.h"

#define DEBUG_PRINTING 1

#include "simple_interface_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void simple_interface_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* simple_interface_Native_Object_deallocator */

simple_interface_Native_Object *simple_interface_Native_Object_create(void)
{
    simple_interface_Native_Object *new_object = (simple_interface_Native_Object *)malloc(sizeof(simple_interface_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* simple_interface_Native_Object_create */

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* simple_interface */
/**
 *
 */ 
float simple_interface_foo(Interpreter_Type *self, any y, simple_dictionary z)
{


    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	/* we return a (meaningless) default value here so the compiler doesn't complain */
	return 0;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo\" :\n");
    debug_print_any("y", y, DEBUG_INDENTATION_WIDTH);
    debug_print_simple_dictionary("z", z, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */

#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    float undefined_return_value = 0;
    debug_print_float("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* simple_interface_foo */

/**
 *
 */ 
void simple_interface_bar(Interpreter_Type *self, int32_t_array a, simple_enum b)
{


    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"bar\" :\n");
    debug_print_int32_t_array("a", a, DEBUG_INDENTATION_WIDTH);
    debug_print_simple_enum("b", b, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_bar */

/**
 *
 */ 
void simple_interface_baz(Interpreter_Type *self, bool a, int32_t b, float_array c)
{



    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"baz\" :\n");
    debug_print_bool("a", a, DEBUG_INDENTATION_WIDTH);
    debug_print_int32_t("b", b, DEBUG_INDENTATION_WIDTH);
    debug_print_float_array("c", c, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_baz */

/**
 *
 */ 
void simple_interface_foo2(Interpreter_Type *self, boolean_or_float_or_long x)
{

    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo2\" :\n");
    debug_print_boolean_or_float_or_long("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo2 */

/**
 *
 */ 
void simple_interface_foo3(Interpreter_Type *self, float_or_long x)
{

    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo3\" :\n");
    debug_print_float_or_long("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo3 */

/**
 *
 */ 
void simple_interface_foo4(Interpreter_Type *self, boolean_or_string x)
{

    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo4\" :\n");
    debug_print_boolean_or_string("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo4 */

/**
 *
 */ 
void simple_interface_foo5(Interpreter_Type *self, boolean_or_double_or_simple_dictionary x)
{

    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo5\" :\n");
    debug_print_boolean_or_double_or_simple_dictionary("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo5 */

/**
 *
 */ 
void simple_interface_call_simple_callback(Interpreter_Type *self, simple_callback call)
{
    simple_callback _temp__for_call = call;
#define call(...) (run_simple_callback_function(_temp__for_call, *self, __VA_ARGS__))

    Interpreter_Error_Type error_check;
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"call_simple_callback\" :\n");
    debug_print_simple_callback("call", call, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    call(5);

#undef call
}; /* simple_interface_call_simple_callback */


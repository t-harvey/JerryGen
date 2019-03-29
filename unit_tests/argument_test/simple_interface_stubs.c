
#include "webidl_compiler_utilities_private.h"
#include "simple_interface_private.h"

#define DEBUG_PRINTING 1

#include "simple_interface_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

simple_interface_Native_Object *create_simple_interface_Native_Object(void)
{
    simple_interface_Native_Object *new_object = (simple_interface_Native_Object *)malloc(sizeof(simple_interface_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* create_simple_interface_Native_Object */

void destroy_simple_interface_Native_Object(void *native_object)
{
	/* USER CODE GOES HERE */

} /* destroy_simple_interface_Native_Object */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* simple_interface */

/**
 *
 */ 
float simple_interface_foo(simple_interface this, any y, simple_dictionary z, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo\" :\n");
   extern void debug_print_any(char *, any, unsigned int);
    debug_print_any("y", y, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_simple_dictionary(char *, simple_dictionary, unsigned int);
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
void simple_interface_bar(simple_interface this, int32_t_array a, simple_enum b, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"bar\" :\n");
   extern void debug_print_int32_t_array(char *, int32_t_array, unsigned int);
    debug_print_int32_t_array("a", a, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_simple_enum(char *, simple_enum, unsigned int);
    debug_print_simple_enum("b", b, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_bar */

/**
 *
 */ 
void simple_interface_baz(simple_interface this, bool a, int32_t b, float_array c, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"baz\" :\n");
   extern void debug_print_bool(char *, bool, unsigned int);
    debug_print_bool("a", a, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("b", b, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_float_array(char *, float_array, unsigned int);
    debug_print_float_array("c", c, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_baz */

/**
 *
 */ 
void simple_interface_foo2(simple_interface this, boolean_or_float_or_long x, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo2\" :\n");
   extern void debug_print_boolean_or_float_or_long(char *, boolean_or_float_or_long, unsigned int);
    debug_print_boolean_or_float_or_long("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo2 */

/**
 *
 */ 
void simple_interface_foo3(simple_interface this, float_or_long x, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo3\" :\n");
   extern void debug_print_float_or_long(char *, float_or_long, unsigned int);
    debug_print_float_or_long("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo3 */

/**
 *
 */ 
void simple_interface_foo4(simple_interface this, boolean_or_string x, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo4\" :\n");
   extern void debug_print_boolean_or_string(char *, boolean_or_string, unsigned int);
    debug_print_boolean_or_string("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo4 */

/**
 *
 */ 
void simple_interface_foo5(simple_interface this, boolean_or_double_or_simple_dictionary x, Interpreter_Error_Type *error)
{
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"foo5\" :\n");
   extern void debug_print_boolean_or_double_or_simple_dictionary(char *, boolean_or_double_or_simple_dictionary, unsigned int);
    debug_print_boolean_or_double_or_simple_dictionary("x", x, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* simple_interface_foo5 */

/**
 *
 */ 
void simple_interface_call_simple_callback(simple_interface this, simple_callback call, Interpreter_Error_Type *error)
{
	simple_callback _temp__for_call = call;
#define call(...) (run_simple_callback(_temp__for_call, this, __VA_ARGS__))
    simple_interface_Native_Object *native_object = simple_interface_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"call_simple_callback\" :\n");
   extern void debug_print_simple_callback(char *, simple_callback, unsigned int);
    debug_print_simple_callback("call", call, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    call(5);

#undef call
}; /* simple_interface_call_simple_callback */



#include "webidl_compiler_utilities_private.h"
#include "call_callback_private.h"

#define DEBUG_PRINTING 1

#include "call_callback_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

call_callback_Native_Object *create_call_callback_Native_Object(void)
{
    call_callback_Native_Object *new_object = (call_callback_Native_Object *)malloc(sizeof(call_callback_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* create_call_callback_Native_Object */

void destroy_call_callback_Native_Object(void *native_object)
{
	/* USER CODE GOES HERE */

} /* destroy_call_callback_Native_Object */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* call_callback */

/**
 *
 */ 
void call_callback_call_it(call_callback this, _object thing, print_it callback, Interpreter_Error_Type *error)
{
	print_it _temp__for_callback = callback;
#define callback(...) (run_print_it(_temp__for_callback, this, __VA_ARGS__))
    call_callback_Native_Object *native_object = call_callback_Native_Object_get(this, error);
    if (*error)
	
        
	return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"call_it\" :\n");
   extern void debug_print__object(char *, _object, unsigned int);
    debug_print__object("thing", thing, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_print_it(char *, print_it, unsigned int);
    debug_print_print_it("callback", callback, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    callback(thing);

#undef callback
}; /* call_callback_call_it */



#include "call_callback_stubs.h"

#undef DEBUG_PRINTING
#include "call_callback_stubs.h"

static jerry_error_t error_check; /* examine this if the value of native_object
    		  	             might be wrong after a call to
				     Native_Object_get() */

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void Native_Object_call_callback_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* Native_Object_call_callback_deallocator */

Native_Object_call_callback *Native_Object_call_callback_create(void)
{
    Native_Object_call_callback *new_object = (Native_Object_call_callback *)malloc(sizeof(Native_Object_call_callback));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* Native_Object_call_callback_create */


jerry_object_native_info_t call_callback_checksum = {Native_Object_call_callback_deallocator};

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* call_callback */
/**
 *
 */ 
void call_callback_call_it_body(JSON thing, print_it callback, Interpreter_Type self)
{
	print_it _temp__for_callback = callback;
#define callback(...) (run_print_it_function(_temp__for_callback, self, __VA_ARGS__))
    /* EXAMINE THE VALUE OF "ERROR_CHECK" IF THERE COULD BE AN ERROR
       WITH AN OBJECT'S Native_Object */    
    Native_Object_call_callback *native_object = Native_Object_get(self, &call_callback_checksum, &error_check);

    /* USER CODE GOES HERE */
    callback(thing);

#undef callback
}; /* call_callback_call_it_body */


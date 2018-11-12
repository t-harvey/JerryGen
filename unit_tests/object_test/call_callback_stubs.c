
#include "webidl_compiler_utilities.h"
#include "call_callback.h"
#include "call_callback_stubs.h"

#include "call_callback_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void call_callback_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* call_callback_Native_Object_deallocator */

call_callback_Native_Object *call_callback_Native_Object_create(void)
{
    call_callback_Native_Object *new_object = (call_callback_Native_Object *)malloc(sizeof(call_callback_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* call_callback_Native_Object_create */

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* call_callback */
/**
 *
 */ 
void call_callback_call_it(Interpreter_Type *self, _object thing, print_it callback)
{

	print_it _temp__for_callback = callback;
#define callback(...) (run_print_it_function(_temp__for_callback, *self, __VA_ARGS__))

    Interpreter_Error_Type error_check;
    call_callback_Native_Object *native_object = call_callback_Native_Object_get(*self, &error_check);
    if (error_check)
    {
        *self = error_check;
	
	return;
    }

    /* USER CODE GOES HERE */
    callback(thing);

#undef callback
}; /* call_callback_call_it */


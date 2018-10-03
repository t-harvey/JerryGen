
#include "arraybuffer_stubs.h"
#include <stdio.h>

#define DEBUG_PRINTING 1

#include "arraybuffer_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void Native_Object_arraybuffer_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* Native_Object_arraybuffer_deallocator */

Native_Object_arraybuffer *Native_Object_arraybuffer_create(void)
{
    Native_Object_arraybuffer *new_object = (Native_Object_arraybuffer *)malloc(sizeof(Native_Object_arraybuffer));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* Native_Object_arraybuffer_create */


Interpreter_Checksum_Type arraybuffer_checksum = {Native_Object_arraybuffer_deallocator};

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* arraybuffer */
/**
 *
 */ 
void arraybuffer_set_arraybuffer_value_body(Interpreter_Type self, ArrayBuffer new_ab)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    Native_Object_arraybuffer *native_object = Native_Object_get(self, &arraybuffer_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"set_arraybuffer_value\" :\n");
    debug_print_ArrayBuffer("new_ab", new_ab, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    insert_arraybuffer_arraybuffer_value(self, new_ab);

}; /* arraybuffer_set_arraybuffer_value_body */

/**
 *
 */ 
ArrayBuffer arraybuffer_get_arraybuffer_value_body(Interpreter_Type self)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    Native_Object_arraybuffer *native_object = Native_Object_get(self, &arraybuffer_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"get_arraybuffer_value\" :\n");
   printf("\tThe function \"get_arraybuffer_value\" takes no parameters.\n");
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */

#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    ArrayBuffer undefined_return_value = extract_arraybuffer_arraybuffer_value(self);
    debug_print_ArrayBuffer("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* arraybuffer_get_arraybuffer_value_body */

/**
 *
 */ 
void arraybuffer_print_arraybuffer_body(Interpreter_Type self, ArrayBuffer ab_param)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    Native_Object_arraybuffer *native_object = Native_Object_get(self, &arraybuffer_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"print_arraybuffer\" :\n");
    debug_print_ArrayBuffer("ab_param", ab_param, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* arraybuffer_print_arraybuffer_body */



#include "arraybuffer_stubs.h"
#include <stdio.h>

#define DEBUG_PRINTING 1

#include "arraybuffer_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void destroy_arraybuffer_Native_Object(void *native_object)
{
	/* USER CODE GOES HERE */

} /* destroy_arraybuffer_Native_Object */

arraybuffer_Native_Object *create_arraybuffer_Native_Object(void)
{
    arraybuffer_Native_Object *new_object = (arraybuffer_Native_Object *)malloc(sizeof(arraybuffer_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* create_arraybuffer_Native_Object */


//Interpreter_Checksum_Type arraybuffer_checksum = {arraybuffer_Native_Object_deallocator};

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* arraybuffer */
/**
 *
 */ 
void arraybuffer_set_arraybuffer_value(Interpreter_Type self, ArrayBuffer new_ab, Interpreter_Error_Type *error)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    arraybuffer_Native_Object *native_object = arraybuffer_Native_Object_get(self, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"set_arraybuffer_value\" :\n");
    debug_print_ArrayBuffer("new_ab", new_ab, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    set_arraybuffer_arraybuffer_value(self, new_ab);

}; /* arraybuffer_set_arraybuffer_value */

/**
 *
 */ 
ArrayBuffer arraybuffer_get_arraybuffer_value(Interpreter_Type this, Interpreter_Error_Type *error)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    arraybuffer_Native_Object *native_object = arraybuffer_Native_Object_get(this, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"get_arraybuffer_value\" :\n");
   printf("\tThe function \"get_arraybuffer_value\" takes no parameters.\n");
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */

#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    ArrayBuffer undefined_return_value = get_arraybuffer_arraybuffer_value(this);
    debug_print_ArrayBuffer("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* arraybuffer_get_arraybuffer_value */

/**
 *
 */ 
void arraybuffer_print_arraybuffer(Interpreter_Type this, ArrayBuffer ab_param, Interpreter_Error_Type *error)
{
    Interpreter_Error_Type error_check; /* this value will be non-zero after
    			                   a call to Native_Object_get() if
					   that call encounters an error */

    arraybuffer_Native_Object *native_object = arraybuffer_Native_Object_get(this, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"print_arraybuffer\" :\n");
    debug_print_ArrayBuffer("ab_param", ab_param, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


}; /* arraybuffer_print_arraybuffer */


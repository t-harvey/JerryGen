
#include "webidl_compiler_utilities_private.h"
#include "holds_a_native_object_private.h"

#define DEBUG_PRINTING 1

#include "holds_a_native_object_stubs.h"


/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

holds_a_native_object_Native_Object *holds_a_native_object_Native_Object_create(void)
{
    holds_a_native_object_Native_Object *new_object = (holds_a_native_object_Native_Object *)malloc(sizeof(holds_a_native_object_Native_Object));

	/* USER CODE GOES HERE */

    return new_object;
} /* holds_a_native_object_Native_Object_create */

void holds_a_native_object_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */
    fprintf(stdout, "\tDeallocating: %d\n",
	    ((holds_a_native_object_Native_Object*)native_object)->int_value);
    free(native_object);
} /* holds_a_native_object_Native_Object_deallocator */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* holds_a_native_object */

/**
 *
 */ 
void holds_a_native_object_print_the_native_object(holds_a_native_object this, Interpreter_Error_Type *_error)
{
    holds_a_native_object_Native_Object *native_object = holds_a_native_object_Native_Object_get(this, _error);
    if (*_error)
        return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"print_the_native_object\" :\n");
   printf("\tThe function \"print_the_native_object\" takes no parameters.\n");
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
   fprintf(stdout, "NATIVE_OBJECT: %d\n", native_object->int_value);

}; /* holds_a_native_object_print_the_native_object */

/**
 *
 */ 
void holds_a_native_object_null_out_native_object_pointer(holds_a_native_object this, Interpreter_Error_Type *_error)
{
    holds_a_native_object_Native_Object *native_object = holds_a_native_object_Native_Object_get(this, _error);
    if (*_error)
        return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"null_out_native_object_pointer\" :\n");
   printf("\tThe function \"null_out_native_object_pointer\" takes no parameters.\n");
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#include "holds_a_different_native_object_private.h"
extern void Native_Object_set(Interpreter_Type object, void *new_value, Interpreter_Checksum_Type *checksum);
    Native_Object_set(this, NULL, &holds_a_different_native_object_checksum);

}; /* holds_a_native_object_null_out_native_object_pointer */

/**
 *
 */ 
holds_a_native_object holds_a_native_object_Constructor_0(holds_a_native_object this, int32_t value_to_store_in_native_object, Interpreter_Error_Type *_error)
{
    holds_a_native_object_Native_Object *native_object = holds_a_native_object_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"Constructor_0\" :\n");
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("value_to_store_in_native_object", value_to_store_in_native_object, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    native_object->int_value = value_to_store_in_native_object;

    return this;

}; /* holds_a_native_object_Constructor_0 */


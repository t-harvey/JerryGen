
#include "webidl_compiler_utilities_private.h"
#include "interface_with_default_private.h"

#define DEBUG_PRINTING 1

#include "interface_with_default_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

interface_with_default_Native_Object *interface_with_default_Native_Object_create(void)
{
    interface_with_default_Native_Object *new_object = (interface_with_default_Native_Object *)malloc(sizeof(interface_with_default_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* interface_with_default_Native_Object_create */

void interface_with_default_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* interface_with_default_Native_Object_deallocator */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* interface_with_default */

/**
 *
 */ 
void interface_with_default_show_defaults(interface_with_default this, callback_with_default x, dictionary_with_default y, int32_t operation_default, Interpreter_Error_Type *_error)
{
	callback_with_default _temp__for_x = x;
#define x(...) (run_callback_with_default_function(_temp__for_x, this, __VA_ARGS__))
    interface_with_default_Native_Object *native_object = interface_with_default_Native_Object_get(this, _error);
    if (*_error)
        return;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"show_defaults\" :\n");
   extern void debug_print_callback_with_default(char *, callback_with_default, unsigned int);
    debug_print_callback_with_default("x", x, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_dictionary_with_default(char *, dictionary_with_default, unsigned int);
    debug_print_dictionary_with_default("y", y, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("operation_default", operation_default, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */


#undef x


}; /* interface_with_default_show_defaults */

/**
 *
 */ 
interface_with_default interface_with_default_Constructor_0(interface_with_default this, int32_t constructor_arg, Interpreter_Error_Type *_error)
{
    interface_with_default_Native_Object *native_object = interface_with_default_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"Constructor_0\" :\n");
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("constructor_arg", constructor_arg, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */

    return this;

}; /* interface_with_default_Constructor_0 */


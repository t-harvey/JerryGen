
#ifndef holds_a_native_object_STUBS_HEADER_FILE
#define holds_a_native_object_STUBS_HEADER_FILE 1
#include "webidl_compiler_utilities.h"

#include "holds_a_native_object.h"

/* each Javascript object can have a single C object associated with
   it, which we call a Native_Object ("native" to the C code); these
   Native_Objects are attached to their objects by the interpreter, and
   the interpreter also keeps track of when the associated object is
   destroyed -- when a Javascript object is destroyed, the interpreter
   will call a user function to deallocate the associated Native_Object;
   thus, when we assign a Native_Object to a Javascript object using
   holds_a_native_object_Native_Object_set, we also give it a deallocator
   for that Native_Object (note that the function can be null if there
   isn't any memory to free) */
typedef struct {
    /* USER CODE GOES HERE */
    int int_value;
} holds_a_native_object_Native_Object;

#include "holds_a_native_object.h"

holds_a_native_object_Native_Object *holds_a_native_object_Native_Object_create(void);
void holds_a_native_object_Native_Object_deallocator(void *native_object);

extern holds_a_native_object_Native_Object *holds_a_native_object_Native_Object_get(holds_a_native_object this,
                                      Interpreter_Error_Type *error_check);
extern void holds_a_native_object_Native_Object_set(holds_a_native_object this,
                                      holds_a_native_object_Native_Object *new_value);


/* operations in the interface: */

void holds_a_native_object_print_the_native_object(holds_a_native_object this, Interpreter_Error_Type *_error);
void holds_a_native_object_null_out_native_object_pointer(holds_a_native_object this, Interpreter_Error_Type *_error);
holds_a_native_object holds_a_native_object_Constructor_0(holds_a_native_object this, int32_t value_to_store_in_native_object, Interpreter_Error_Type *_error);

#endif /* holds_a_native_object_STUBS_HEADER_FILE */

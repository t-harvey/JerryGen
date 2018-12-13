
#include "webidl_compiler_utilities_private.h"
#include "any_type_test_private.h"

#undef DEBUG_PRINTING
#include "any_type_test_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

any_type_test_Native_Object *any_type_test_Native_Object_create(void)
{
    any_type_test_Native_Object *new_object = (any_type_test_Native_Object *)malloc(sizeof(any_type_test_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* any_type_test_Native_Object_create */

void any_type_test_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* any_type_test_Native_Object_deallocator */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* any_type_test */

/**
 *
 */ 
any any_type_test_do_something(any_type_test this, type_sent_in arg1_type, any arg1, type_sent_in arg2_type, any arg2, Interpreter_Error_Type *error)
{
    any_type_test_Native_Object *native_object = any_type_test_Native_Object_get(this, error);
    if (*error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return any_constructor();

    /* USER CODE GOES HERE */
  any return_value;
    static int type_lookup[] = {
	/*BOOLEAN_T*/ boolean_uid,
	/*BYTE_T*/ byte_uid,
	/*OCTET_T*/ octet_uid,
	/*SHORT_T*/ short_uid,
	/*UNSIGNEDSHORT_T*/ unsignedshort_uid,
	/*LONG_T*/ long_uid,
	/*UNSIGNEDSHORT_T*/ unsignedshort_uid,
	/*LONGLONG_T*/ longlong_uid,
	/*UNSIGNEDLONGLONG_T*/ unsignedlonglong_uid,
	/*FLOAT_T*/ float_uid,
	/*DOUBLE_T*/ double_uid,
	/*STRING_T*/ string_uid
    }; /* type_lookup */

    return_value.union_type = type_lookup[arg1_type];

    /* if types don't match, what do we do? */
    if (arg1_type != arg2_type)
    {
	return_value.union_type = boolean_uid;
	return_value.value.boolean_field = true;
    }
    else /* types match */
    {
	return_value.union_type = arg1_type;
	switch (arg1_type)
	{
	    case boolean_uid:
		return_value.value.boolean_field = arg1.value.boolean_field &&
		                                   arg2.value.boolean_field;
		break;
	    case byte_uid:
		return_value.value.byte_field = 
		                      ((int8_t)arg1.value.double_field) +
		                      ((int8_t)arg2.value.double_field);
		break;
	    case octet_uid:
		return_value.value.octet_field =
		                      ((uint8_t)arg1.value.double_field) +
		                      ((uint8_t)arg2.value.double_field);
		break;
	    case short_uid:
		return_value.value.short_field = 
		                      ((int16_t)arg1.value.double_field) +
		                      ((int16_t)arg2.value.double_field);
		break;
	    case unsignedshort_uid:
		return_value.value.unsignedshort_field =
		                      ((uint16_t)arg1.value.double_field) +
		                      ((uint16_t)arg2.value.double_field);
		break;
	    case long_uid:
		return_value.value.long_field =
		                      ((int32_t)arg1.value.double_field) +
		                      ((int32_t)arg2.value.double_field);
		break;
	    case unsignedlong_uid:
		return_value.value.unsignedlong_field =
		                      ((uint32_t)arg1.value.double_field) +
		                      ((uint32_t)arg2.value.double_field);
		break;
	    case longlong_uid:
		return_value.value.longlong_field =
		                      ((int64_t)arg1.value.double_field) +
		                      ((int64_t)arg2.value.double_field);
		break;
	    case unsignedlonglong_uid:
		return_value.value.unsignedlonglong_field =
		                      ((uint64_t)arg1.value.double_field) +
		                      ((uint64_t)arg2.value.double_field);
		break;
	    case float_uid:
		return_value.value.float_field =
		                      ((float)arg1.value.double_field) +
		                      ((float)arg2.value.double_field);
		break;
	    case double_uid:
		return_value.value.double_field =
		                      arg1.value.double_field +
		                      arg2.value.double_field;
		break;
	    case string_uid:
{
		int arg1_length = strlen(arg1.value.string_field);
		int arg2_length = strlen(arg2.value.string_field);
		return_value.value.string_field = malloc(sizeof(char) *
						   (arg1_length + arg2_length) +
						   2 /* one for the space, one
							for the null */);
		strcpy(return_value.value.string_field,
		       arg1.value.string_field);
		strcpy(return_value.value.string_field + arg1_length, " ");
		strcpy(return_value.value.string_field + arg1_length+1,
		       arg2.value.string_field);
		*(return_value.value.string_field+arg1_length+arg2_length+1) =
		    '\0';
}
		break;
	}; /* switch(arg1_type) */
    }

    return return_value;
}; /* any_type_test_do_something */


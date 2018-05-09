
/*# AUTOMATICALLY GENERATED ON Thu Mar 01 2018 10:06:44 GMT-0600 (CST) #*/
#include "any_type_test_stubs.h"
#include <stdio.h>

#define DEBUG_PRINTING 1

#include "any_type_test_stubs.h"

static jerry_error_t error_check; /* examine this if the value of native_object
    		  	             might be wrong after a call to
				     Native_Object_get() */

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

void Native_Object_any_type_test_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* Native_Object_any_type_test_deallocator */

Native_Object_any_type_test *Native_Object_any_type_test_create(void)
{
    Native_Object_any_type_test *new_object = (Native_Object_any_type_test *)malloc(sizeof(Native_Object_any_type_test));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* Native_Object_any_type_test_create */


jerry_object_native_info_t any_type_test_checksum = {Native_Object_any_type_test_deallocator};

/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* any_type_test */
any any_type_test_do_something_body(type_sent_in arg1_type, any arg1, type_sent_in arg2_type, any arg2, Interpreter_Type this_val)
{
    /* EXAMINE THE VALUE OF "ERROR_CHECK" IF THERE COULD BE AN ERROR
       WITH AN OBJECT'S Native_Object */    
    Native_Object_any_type_test *native_object = Native_Object_get(this_val, &any_type_test_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"do_something\" :\n");
    debug_print_type_sent_in("arg1_type", arg1_type, DEBUG_INDENTATION_WIDTH);
    debug_print_any("arg1", arg1, DEBUG_INDENTATION_WIDTH);
    debug_print_type_sent_in("arg2_type", arg2_type, DEBUG_INDENTATION_WIDTH);
    debug_print_any("arg2", arg2, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

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

}; /* any_type_test_do_something_body */


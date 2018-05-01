
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
Union_Type_For_Any any_type_test_do_something_body(type_sent_in arg1_type, Union_Type_For_Any arg1, type_sent_in arg2_type, Union_Type_For_Any arg2, Interpreter_Type this_val)
{
    /* EXAMINE THE VALUE OF "ERROR_CHECK" IF THERE COULD BE AN ERROR
       WITH AN OBJECT'S Native_Object */    
    Native_Object_any_type_test *native_object = Native_Object_get(this_val, &any_type_test_checksum, &error_check);

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"do_something\" :\n");
    debug_print_type_sent_in("arg1_type", arg1_type, DEBUG_INDENTATION_WIDTH);
    debug_print_Union_Type_For_Any("arg1", arg1, DEBUG_INDENTATION_WIDTH);
    debug_print_type_sent_in("arg2_type", arg2_type, DEBUG_INDENTATION_WIDTH);
    debug_print_Union_Type_For_Any("arg2", arg2, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */

    Union_Type_For_Any return_value;
    static Union_Type type_lookup[] = {
	/*BOOLEAN_T*/ Boolean_uid,
	/*BYTE_T*/ Byte_uid,
	/*OCTET_T*/ Octet_uid,
	/*SHORT_T*/ Short_uid,
	/*UNSIGNEDSHORT_T*/ Unsignedshort_uid,
	/*LONG_T*/ Long_uid,
	/*UNSIGNEDSHORT_T*/ Unsignedshort_uid,
	/*LONGLONG_T*/ Longlong_uid,
	/*UNSIGNEDLONGLONG_T*/ Unsignedlonglong_uid,
	/*FLOAT_T*/ Float_uid,
	/*DOUBLE_T*/ Double_uid,
	/*STRING_T*/ String_uid
    }; /* type_lookup */

    return_value.union_type = type_lookup[arg1_type];

    /* if types don't match, what do we do? */
    if (arg1_type != arg2_type)
    {
	return_value.value.Boolean = true;
    }
    else /* types match */
    {
	switch (arg1_type)
	{
	    case Boolean_uid:
		return_value.value.Boolean = arg1.value.Boolean && arg2.value.Boolean;
		break;
	    case Byte_uid:
		return_value.value.Byte = ((int8_t)arg1.value.Double) + ((int8_t)arg2.value.Double);
		break;
	    case Octet_uid:
		return_value.value.Octet = ((uint8_t)arg1.value.Double) + ((uint8_t)arg2.value.Double);
		break;
	    case Short_uid:
		return_value.value.Short = ((int16_t)arg1.value.Double) + ((int16_t)arg2.value.Double);
		break;
	    case Short_uid:
		return_value.value.UnsignedShort =
		                         ((uint16_t)arg1.value.Double) + ((uint16_t)arg2.value.Double);
		break;
	    case Long_uid:
		return_value.value.Long = ((int32_t)arg1.value.Double) + ((int32_t)arg2.value.Double);
		break;
	    case UnsignedLong_uid:
		return_value.value.UnsignedLong =
		                         ((uint32_t)arg1.value.Double) + ((uint32_t)arg2.value.Double);
		break;
	    case LongLong_uid:
		return_value.value.LongLong = ((int64_t)arg1.value.Double) + ((int64_t)arg2.value.Double);
		break;
	    case UnsignedLongLong:
		return_value.value.UnsignedLongLong =
		                         ((uint64_t)arg1.value.Double) + ((uint64_t)arg2.value.Double);
		break;
	    case Float_uid:
		return_value.value.Float = ((float)arg1.value.Double) + ((float)arg2.value.Double);
		break;
	    case Double_uid:
		return_value.value.Double =
		                         arg1.value.Double + arg2.value.Double;
		break;
	    case String_uid:
{
		int arg1_length = strlen(arg1.value.String);
		int arg2_length = strlen(arg2.value.String);
		return_value.value.String = malloc(sizeof(char) *
						   (arg1_length + arg2_length) +
						   2 /* one for the space, one
							for the null */);
		strcpy(return_value.value.String, arg1.value.String);
		strcpy(return_value.value.String+arg1_length, " ");
		strcpy(return_value.value.String+arg1_length+1,
		       arg2.value.String);
		*(return_value.value.String+arg1_length+arg2_length+1) = '\0';
}
		break;
	}; /* switch(arg1_type) */
    }

    return return_value;

}; /* any_type_test_do_something_body */


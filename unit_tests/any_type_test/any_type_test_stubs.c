
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
	/* BOOL */     BOOLEAN,
	/* INT8_T */   INT8,
	/* INT16_T */  INT16,
	/* UINT16_T */ UINT16,
	/* INT32_T */  INT32,
	/* UINT32_T */ UINT32,
	/* INT64_T */  INT64,
	/* UINT64_T */ UINT64,
	/* FLOAT_T */  FLOAT,
	/* DOUBLE_T */ DOUBLE,
	/* STRING_T */ STRING
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
	    case BOOL:
		return_value.value.Boolean = arg1.value.Boolean && arg2.value.Boolean;
		break;
	    case INT8_T:
		return_value.value.Int8 = ((int8_t)arg1.value.Double) + ((int8_t)arg2.value.Double);
		break;
	    case INT16_T:
		return_value.value.Int16 = ((int16_t)arg1.value.Double) + ((int16_t)arg2.value.Double);
		break;
	    case UINT16_T:
		return_value.value.Uint16 =
		                         ((uint16_t)arg1.value.Double) + ((uint16_t)arg2.value.Double);
		break;
	    case INT32_T:
		return_value.value.Int32 = ((int32_t)arg1.value.Double) + ((int32_t)arg2.value.Double);
		break;
	    case UINT32_T:
		return_value.value.Uint32 =
		                         ((uint32_t)arg1.value.Double) + ((uint32_t)arg2.value.Double);
		break;
	    case INT64_T:
		return_value.value.Int64 = ((int64_t)arg1.value.Double) + ((int64_t)arg2.value.Double);
		break;
	    case UINT64_T:
		return_value.value.Uint64 =
		                         ((uint64_t)arg1.value.Double) + ((uint64_t)arg2.value.Double);
		break;
	    case FLOAT_T:
		return_value.value.Float = ((float)arg1.value.Double) + ((float)arg2.value.Double);
		break;
	    case DOUBLE_T:
		return_value.value.Double =
		                         arg1.value.Double + arg2.value.Double;
		break;
	    case STRING_T:
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


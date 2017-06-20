/* AUTOMATICALLY GENERATED ON Thu May 11 2017 16:36:12 GMT-0500 (CDT) */

// these are included to simplify the generator. Remove if not needed.
#include <string>
#include <vector>

#include "performance.idl_Types.h"
#include "jerry-api.h"





















/* if there are any callbacks, we'll use these wrapper functions to
   marshal the parameters for the function and then call the
   function through the interpreter */



Performance jerry_get_Performance_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    Performance return_struct;


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_Performance_value */

jerry_value_t jerry_create_Performance(Performance x)
{
    jerry_value_t dummy_jerry_value;
extern jerry_value_t create_Performance_interface_handler(const jerry_value_t,
					   const jerry_value_t,
					   const jerry_value_t *,
					   const jerry_length_t);
    jerry_value_t new_jerry_value = create_Performance_interface_handler(
							dummy_jerry_value,
							dummy_jerry_value,
							&dummy_jerry_value,
							0);

    return new_jerry_value;    
} /* jerry_create_Performance */




/* AUTOMATICALLY GENERATED ON Thu May 11 2017 16:36:12 GMT-0500 (CDT) */
#ifndef performance.idl_TYPES_H_
#define performance.idl_TYPES_H_

// these are included to simplify the generator. Remove if not needed.
#include <string>
#include <vector>

#include "jerry-api.h"



/* DICTIONARIES */


/* INTERFACES */
typedef struct {
} Performance;


/* INITIALIZATION FUNCTIONS */
void load_Performance_interface(void);

#define load_all_performance.idl_interfaces {\
load_Performance_interface(); \
} /* load_all_performance.idl_interfaces */



/***********************IGNORE FUNCTIONS BELOW THIS LINE ****************/











/* if there are any callbacks, we'll use these wrapper functions to
   marshal the parameters for the function and then call the
   function through the interpreter */



Performance jerry_get_Performance_value(jerry_value_t value);

jerry_value_t jerry_create_Performance(Performance x);



#endif /* performance.idl_TYPES_H_ */

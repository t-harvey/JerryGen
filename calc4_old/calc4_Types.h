/* AUTOMATICALLY GENERATED ON Wed Jun 28 2017 11:13:34 GMT-0500 (CDT) */
#ifndef calc4_TYPES_H_
#define calc4_TYPES_H_

// these are included to simplify the generator. Remove if not needed.
#include <string>
#include <vector>

typedef char * string;

#include "jerry-api.h"

/* calls to functions residing in the Javascript environment require
   extra context; from the C-programmer's point of view, callbacks
   can be thought of as _being_ this context -- for example, when
   passing around a "callback", we'll actually pass around this
   context structure, and then the generator will generate #def's
   to wrap the generic call that uses this context into an easily
   used C function */
typedef struct {
    jerry_value_t function_value; /* Jerryscript's function pointer */
    jerry_value_t this_value;     /* i.e., "this" pointer */
} callback_context;

typedef struct {
    int32_t bob;
} unused_struct;

typedef struct {
    int32_t bob;
} unused_struct2;

typedef callback_context PrintCallback0_calling_context;

typedef struct {
} Long_Calculator_no_interface;

typedef struct {
} Long_Calculator;

typedef struct {
} Double_Calculator;

typedef struct {
    double real;
    double imag;
} complex;

typedef callback_context PrintCallback1_calling_context;

typedef struct {
    int32_t long_attribute;
    int32_t string_attribute;
    PrintCallback1_calling_context print_it;
} Complex_Calculator;
#define attribute_Complex_Calculator_long_attribute (extract_Complex_Calculator_long_attribute(this_val))
#define attribute_Complex_Calculator_string_attribute (extract_Complex_Calculator_string_attribute(this_val))
#define attribute_Complex_Calculator_print_it (extract_Complex_Calculator_print_it(this_val))

typedef callback_context PrintCallback2_calling_context;

typedef callback_context Print3_calling_context;


/* INITIALIZATION FUNCTIONS */
void load_Long_Calculator_no_interface_interface(void);
void load_Long_Calculator_interface(void);
void load_Double_Calculator_interface(void);
void load_Complex_Calculator_interface(void);

#define load_all_calc4_interfaces {\
create_interface_prototypes_holder(); \
load_Long_Calculator_no_interface_interface(); \
load_Long_Calculator_interface(); \
load_Double_Calculator_interface(); \
load_Complex_Calculator_interface(); \
} /* load_all_calc4_interfaces */


/***********************IGNORE FUNCTIONS BELOW THIS LINE ****************/
#define jerry_get_int8_t_value (int8_t)jerry_get_number_value
#define jerry_get_uint8_t_value (uint8_t)jerry_get_number_value
#define jerry_get_int16_t_value (int16_t)jerry_get_number_value
#define jerry_get_uint16_t_value (uint16_t)jerry_get_number_value
#define jerry_get_int32_t_value (int32_t)jerry_get_number_value
#define jerry_get_uint32_t_value (uint32_t)jerry_get_number_value
#define jerry_get_int64_t_value (int64_t)jerry_get_number_value
#define jerry_get_uint64_t_value (uint64_t)jerry_get_number_value
#define jerry_get_float_value (float)jerry_get_number_value
#define jerry_get_double_value (double)jerry_get_number_value
#define jerry_get_bool_value (bool)jerry_get_boolean_value


#include <stdlib.h>
char *jerry_get_string_value(jerry_value_t string_value);



unused_struct jerry_get_unused_struct_value(jerry_value_t value);

jerry_value_t jerry_create_unused_struct(unused_struct x);

unused_struct2 jerry_get_unused_struct2_value(jerry_value_t value);

jerry_value_t jerry_create_unused_struct2(unused_struct2 x);

complex jerry_get_complex_value(jerry_value_t value);

jerry_value_t jerry_create_complex(complex x);








/* attribute GETTERS */
int32_t extract_Complex_Calculator_long_attribute (jerry_value_t this_pointer);

int32_t extract_Complex_Calculator_string_attribute (jerry_value_t this_pointer);

PrintCallback1_calling_context extract_Complex_Calculator_print_it (jerry_value_t this_pointer);





/* if there are any callbacks, we'll use these wrapper functions to
   marshal the parameters for the function and then call the
   function through the interpreter */

complex
run_PrintCallback0_function(const PrintCallback0_calling_context PrintCallback0_context);

void
run_PrintCallback1_function(const PrintCallback1_calling_context PrintCallback1_context,
                              complex x);
void
run_PrintCallback2_function(const PrintCallback2_calling_context PrintCallback2_context,
                              complex x,
                              complex y);
void
run_Print3_function(const Print3_calling_context Print3_context,
                      complex x,
                      complex y,
                      complex z);


Long_Calculator_no_interface jerry_get_Long_Calculator_no_interface_value(jerry_value_t value);

jerry_value_t jerry_create_Long_Calculator_no_interface(Long_Calculator_no_interface x);

Long_Calculator jerry_get_Long_Calculator_value(jerry_value_t value);

jerry_value_t jerry_create_Long_Calculator(Long_Calculator x);

Double_Calculator jerry_get_Double_Calculator_value(jerry_value_t value);

jerry_value_t jerry_create_Double_Calculator(Double_Calculator x);

Complex_Calculator jerry_get_Complex_Calculator_value(jerry_value_t value);

jerry_value_t jerry_create_Complex_Calculator(Complex_Calculator x);


void register_function_call(jerry_value_t enclosing_object,
				   const char *function_name,
       			           jerry_external_handler_t handler);
void create_interface_prototypes_holder();

/* helper function for the getter/setters, below */
jerry_value_t get_prototype(char * interface_name);
void register_prototype(char * interface_name, jerry_value_t new_prototype);


#endif /* calc4_TYPES_H_ */

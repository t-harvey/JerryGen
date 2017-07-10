/*# AUTOMATICALLY GENERATED ON Mon Apr 17 2017 13:34:55 GMT-0500 (CDT) #*/
#include "calc4_Types.h"
/* marshals the parameters for the function and then calls the
   function through the interpreter */

/* Complex_Calculator */
complex Complex_Calculator_add_body(complex x, complex y,  jerry_value_t this_ptr)
{
    complex z = {x.real+y.real, x.imag+y.imag};
    return z;
}; /* Complex_Calculator_add_body */
//
//
void Complex_Calculator_add_and_print_body(complex x, complex y, PrintCallback1_calling_context print_it_context,  jerry_value_t this_ptr)
{
#define print_it(...) (run_PrintCallback1_function(print_it_context, __VA_ARGS__))
    complex z = {x.real+y.real, x.imag+y.imag};
    print_it(z);
}; /* Complex_Calculator_add_and_print_body */
//
//
complex Complex_Calculator_subtract_body(complex x, complex y,  jerry_value_t this_ptr)
{
    complex z = {x.real-y.real, x.imag-y.imag};
    return z;
}; /* Complex_Calculator_subtract_body */
//
//
complex Complex_Calculator_multiply_body(complex x, complex y,  jerry_value_t this_ptr)
{
    complex z = {x.real*y.real, x.imag*y.imag};
    return z;
}; /* Complex_Calculator_multiply_body */
//
//
complex Complex_Calculator_divide_body(complex x, complex y,  jerry_value_t this_ptr)
{
    complex z = {x.real/y.real, x.imag/y.imag};
    return z;
}; /* Complex_Calculator_divide_body */
//
//
char * Complex_Calculator_reflect_string_body(char * x,  jerry_value_t this_ptr)
{
    return x;
}; /* Complex_Calculator_reflect_string_body */
//
//
//
//

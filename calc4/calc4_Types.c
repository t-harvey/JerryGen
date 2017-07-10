/* AUTOMATICALLY GENERATED ON Mon Jul 10 2017 09:52:03 GMT-0500 (CDT) */

// these are included to simplify the generator. Remove if not needed.
//#include <string>
//#include <vector>
#include <stdio.h>

typedef char * string;

#include "calc4_Types.h"
#include "jerryscript.h"


/* for Native_Objects, we need to store the deallocator along with the
   actual object, so we'll keep our own data structure to do this, and
   this is what actually gets stored in the Javascript object, with the
   get() and set() routines hiding the details from the user */
/* if we are outputing this code in a language that has closures, we
   would be able to delete this object at the same time that we call
   the user's deallocator function; for now, we'll leak (at least) 2 pointer
   values every time an object gets deallocated */
typedef struct {
    jerry_object_native_info_t deallocator;
    void *thing;
} Native_Object;
void Native_Object_set(void *thing, thing_deallocator deallocator, jerry_value_t object)
{
    Native_Object *new_thing = (Native_Object *)malloc(sizeof(Native_Object));

    new_thing->deallocator.free_cb = deallocator;
    new_thing->thing = thing;

    jerry_set_object_native_pointer(object, new_thing, &(new_thing->deallocator));
} /* Native_Object_set */

void *Native_Object_get(jerry_value_t object)
{
    jerry_object_native_info_t *deallocator;
    Native_Object *thing;

    jerry_get_object_native_pointer(object, (void**)&thing, (const jerry_object_native_info_t **)&deallocator);

    if (thing->deallocator.free_cb != deallocator->free_cb)
    {
        fprintf(stderr, "Deallocator is different.\n");
	return NULL; /* TODO: is this the right thing in this case? */
    }
    if (thing == NULL)
    {
        fprintf(stderr, "The object has been deallocated.\n");
	return NULL; /* TODO: is the error message accurate? */
    }
    return thing->thing;
} /* Native_Object_get */






#include <stdlib.h>
char *jerry_get_string_value(jerry_value_t string_value)
{
    int string_length = jerry_get_string_length(string_value);
    jerry_char_t *return_value = (jerry_char_t *)malloc(sizeof(jerry_char_t)*(string_length+1));

    int characters_copied = jerry_string_to_char_buffer(string_value,
                                        return_value, string_length);

    if (characters_copied != string_length)
    {
       fprintf(stderr, "PROBLEM WITH STRING COPY!\n");
       /*abort();*/
    }

    return_value[string_length]='\0';
    return (char *)return_value;
} /* jerry_get_string_value */



unused_struct jerry_get_unused_struct_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    unused_struct return_struct;

    jerry_value_t bob_prop_name = jerry_create_string((const jerry_char_t *) "bob");
    jerry_value_t bob_value = jerry_get_property(object_value, bob_prop_name);
/*    return_struct.bob = (int32_t)jerry_get_int32_t_value(bob_value);*/
    return_struct.bob = (int32_t)jerry_get_int32_t_value(bob_value);
    jerry_release_value(bob_prop_name);
    jerry_release_value(bob_value);


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_unused_struct_value */

jerry_value_t jerry_create_unused_struct(unused_struct x)
{
    jerry_value_t new_jerry_value = jerry_create_object();

    jerry_value_t bob_prop_name = jerry_create_string ((const jerry_char_t *) "bob");
    jerry_value_t bob_value = jerry_create_number(x.bob);
    jerry_set_property(new_jerry_value, bob_prop_name, bob_value);
    jerry_release_value(bob_value);
    jerry_release_value(bob_prop_name);


    return new_jerry_value;
    
} /* jerry_create_unused_struct */

unused_struct2 jerry_get_unused_struct2_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    unused_struct2 return_struct;

    jerry_value_t bob_prop_name = jerry_create_string((const jerry_char_t *) "bob");
    jerry_value_t bob_value = jerry_get_property(object_value, bob_prop_name);
/*    return_struct.bob = (int32_t)jerry_get_int32_t_value(bob_value);*/
    return_struct.bob = (int32_t)jerry_get_int32_t_value(bob_value);
    jerry_release_value(bob_prop_name);
    jerry_release_value(bob_value);


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_unused_struct2_value */

jerry_value_t jerry_create_unused_struct2(unused_struct2 x)
{
    jerry_value_t new_jerry_value = jerry_create_object();

    jerry_value_t bob_prop_name = jerry_create_string ((const jerry_char_t *) "bob");
    jerry_value_t bob_value = jerry_create_number(x.bob);
    jerry_set_property(new_jerry_value, bob_prop_name, bob_value);
    jerry_release_value(bob_value);
    jerry_release_value(bob_prop_name);


    return new_jerry_value;
    
} /* jerry_create_unused_struct2 */

complex jerry_get_complex_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    complex return_struct;

    jerry_value_t real_prop_name = jerry_create_string((const jerry_char_t *) "real");
    jerry_value_t real_value = jerry_get_property(object_value, real_prop_name);
/*    return_struct.real = (double)jerry_get_double_value(real_value);*/
    return_struct.real = (double)jerry_get_double_value(real_value);
    jerry_release_value(real_prop_name);
    jerry_release_value(real_value);

    jerry_value_t imag_prop_name = jerry_create_string((const jerry_char_t *) "imag");
    jerry_value_t imag_value = jerry_get_property(object_value, imag_prop_name);
/*    return_struct.imag = (double)jerry_get_double_value(imag_value);*/
    return_struct.imag = (double)jerry_get_double_value(imag_value);
    jerry_release_value(imag_prop_name);
    jerry_release_value(imag_value);


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_complex_value */

jerry_value_t jerry_create_complex(complex x)
{
    jerry_value_t new_jerry_value = jerry_create_object();

    jerry_value_t real_prop_name = jerry_create_string ((const jerry_char_t *) "real");
    jerry_value_t real_value = jerry_create_number(x.real);
    jerry_set_property(new_jerry_value, real_prop_name, real_value);
    jerry_release_value(real_value);
    jerry_release_value(real_prop_name);

    jerry_value_t imag_prop_name = jerry_create_string ((const jerry_char_t *) "imag");
    jerry_value_t imag_value = jerry_create_number(x.imag);
    jerry_set_property(new_jerry_value, imag_prop_name, imag_value);
    jerry_release_value(imag_value);
    jerry_release_value(imag_prop_name);


    return new_jerry_value;
    
} /* jerry_create_complex */








/* attribute GETTERS */
int32_t extract_Complex_Calculator_long_attribute (jerry_value_t this_pointer)
{
    jerry_value_t property_pointer = jerry_create_string((const jerry_char_t *) "long_attribute");
    jerry_value_t attribute_pointer = jerry_get_property(this_pointer, property_pointer);
    int32_t return_value = (int32_t)jerry_get_int32_t_value(attribute_pointer);
    jerry_release_value(property_pointer);
    jerry_release_value(attribute_pointer);
    return return_value;
} /* extract_Complex_Calculator_long_attribute */

int32_t extract_Complex_Calculator_string_attribute (jerry_value_t this_pointer)
{
    jerry_value_t property_pointer = jerry_create_string((const jerry_char_t *) "string_attribute");
    jerry_value_t attribute_pointer = jerry_get_property(this_pointer, property_pointer);
    int32_t return_value = (int32_t)jerry_get_int32_t_value(attribute_pointer);
    jerry_release_value(property_pointer);
    jerry_release_value(attribute_pointer);
    return return_value;
} /* extract_Complex_Calculator_string_attribute */

PrintCallback1_calling_context extract_Complex_Calculator_print_it (jerry_value_t this_pointer)
{
    jerry_value_t property_pointer = jerry_create_string((const jerry_char_t *) "print_it");
    jerry_value_t attribute_pointer = jerry_get_property(this_pointer, property_pointer);

    jerry_release_value(property_pointer);

    return (PrintCallback1_calling_context){attribute_pointer, this_pointer};
} /* extract_Complex_Calculator_print_it */





/* if there are any callbacks, we'll use these wrapper functions to
   marshal the parameters for the function and then call the
   function through the interpreter */

complex
run_PrintCallback0_function(const PrintCallback0_calling_context PrintCallback0_context)

{

    jerry_value_t argv[] = {  };
    jerry_value_t jerry_return_value = jerry_call_function(PrintCallback0_context.function_value,
							   PrintCallback0_context.this_value,
						           argv, 0);
	
    return (complex)jerry_get_complex_value(jerry_return_value);
} /* run_PrintCallback0_function */
void
run_PrintCallback1_function(const PrintCallback1_calling_context PrintCallback1_context,
                              complex x)
{
    jerry_value_t x_value = jerry_create_complex(x);

    jerry_value_t argv[] = { x_value };
    jerry_value_t jerry_return_value = jerry_call_function(PrintCallback1_context.function_value,
							   PrintCallback1_context.this_value,
						           argv, 1);
	
} /* run_PrintCallback1_function */
void
run_PrintCallback2_function(const PrintCallback2_calling_context PrintCallback2_context,
                              complex x,
                              complex y)
{
    jerry_value_t x_value = jerry_create_complex(x);
    jerry_value_t y_value = jerry_create_complex(y);

    jerry_value_t argv[] = { x_value,y_value };
    jerry_value_t jerry_return_value = jerry_call_function(PrintCallback2_context.function_value,
							   PrintCallback2_context.this_value,
						           argv, 2);
	
} /* run_PrintCallback2_function */
void
run_Print3_function(const Print3_calling_context Print3_context,
                      complex x,
                      complex y,
                      complex z)
{
    jerry_value_t x_value = jerry_create_complex(x);
    jerry_value_t y_value = jerry_create_complex(y);
    jerry_value_t z_value = jerry_create_complex(z);

    jerry_value_t argv[] = { x_value,y_value,z_value };
    jerry_value_t jerry_return_value = jerry_call_function(Print3_context.function_value,
							   Print3_context.this_value,
						           argv, 3);
	
} /* run_Print3_function */


Long_Calculator_no_interface jerry_get_Long_Calculator_no_interface_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    Long_Calculator_no_interface return_struct;


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_Long_Calculator_no_interface_value */

jerry_value_t jerry_create_Long_Calculator_no_interface(Long_Calculator_no_interface x)
{
    jerry_value_t dummy_jerry_value;
extern jerry_value_t create_Long_Calculator_no_interface_interface_handler(const jerry_value_t,
					   const jerry_value_t,
					   const jerry_value_t *,
					   const jerry_length_t);
    jerry_value_t new_jerry_value = create_Long_Calculator_no_interface_interface_handler(
							dummy_jerry_value,
							dummy_jerry_value,
							&dummy_jerry_value,
							0);

    return new_jerry_value;    
} /* jerry_create_Long_Calculator_no_interface */

Long_Calculator jerry_get_Long_Calculator_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    Long_Calculator return_struct;


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_Long_Calculator_value */

jerry_value_t jerry_create_Long_Calculator(Long_Calculator x)
{
    jerry_value_t dummy_jerry_value;
extern jerry_value_t create_Long_Calculator_interface_handler(const jerry_value_t,
					   const jerry_value_t,
					   const jerry_value_t *,
					   const jerry_length_t);
    jerry_value_t new_jerry_value = create_Long_Calculator_interface_handler(
							dummy_jerry_value,
							dummy_jerry_value,
							&dummy_jerry_value,
							0);

    return new_jerry_value;    
} /* jerry_create_Long_Calculator */

Double_Calculator jerry_get_Double_Calculator_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    Double_Calculator return_struct;


    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_Double_Calculator_value */

jerry_value_t jerry_create_Double_Calculator(Double_Calculator x)
{
    jerry_value_t dummy_jerry_value;
extern jerry_value_t create_Double_Calculator_interface_handler(const jerry_value_t,
					   const jerry_value_t,
					   const jerry_value_t *,
					   const jerry_length_t);
    jerry_value_t new_jerry_value = create_Double_Calculator_interface_handler(
							dummy_jerry_value,
							dummy_jerry_value,
							&dummy_jerry_value,
							0);

    return new_jerry_value;    
} /* jerry_create_Double_Calculator */

Complex_Calculator jerry_get_Complex_Calculator_value(jerry_value_t value)
{
    jerry_value_t object_value = jerry_value_to_object(value);
    Complex_Calculator return_struct;

    jerry_value_t long_attribute_prop_name = jerry_create_string((const jerry_char_t *) "long_attribute");
    jerry_value_t long_attribute_value = jerry_get_property(object_value, long_attribute_prop_name);
    return_struct.long_attribute = (int32_t)jerry_get_int32_t_value(long_attribute_value);
    jerry_release_value(long_attribute_prop_name);
    jerry_release_value(long_attribute_value);
//
    jerry_value_t string_attribute_prop_name = jerry_create_string((const jerry_char_t *) "string_attribute");
    jerry_value_t string_attribute_value = jerry_get_property(object_value, string_attribute_prop_name);
    return_struct.string_attribute = (int32_t)jerry_get_int32_t_value(string_attribute_value);
    jerry_release_value(string_attribute_prop_name);
    jerry_release_value(string_attribute_value);
//
    jerry_value_t print_it_prop_name = jerry_create_string((const jerry_char_t *) "print_it");
    jerry_value_t print_it_value = jerry_get_property(object_value, print_it_prop_name);
    jerry_release_value(print_it_prop_name);
    jerry_release_value(print_it_value);
//

    jerry_release_value(object_value);

    return return_struct;
} /* jerry_get_Complex_Calculator_value */

jerry_value_t jerry_create_Complex_Calculator(Complex_Calculator x)
{
    jerry_value_t dummy_jerry_value;
extern jerry_value_t create_Complex_Calculator_interface_handler(const jerry_value_t,
					   const jerry_value_t,
					   const jerry_value_t *,
					   const jerry_length_t);
    jerry_value_t new_jerry_value = create_Complex_Calculator_interface_handler(
							dummy_jerry_value,
							dummy_jerry_value,
							&dummy_jerry_value,
							0);
    jerry_value_t long_attribute_prop_name = jerry_create_string((const jerry_char_t *) "long_attribute");
    jerry_value_t long_attribute_value = jerry_create_number(x.long_attribute);
    jerry_set_property(new_jerry_value, long_attribute_prop_name, long_attribute_value);
    jerry_release_value(long_attribute_value);
    jerry_release_value(long_attribute_prop_name);
    jerry_value_t string_attribute_prop_name = jerry_create_string((const jerry_char_t *) "string_attribute");
    jerry_value_t string_attribute_value = jerry_create_number(x.string_attribute);
    jerry_set_property(new_jerry_value, string_attribute_prop_name, string_attribute_value);
    jerry_release_value(string_attribute_value);
    jerry_release_value(string_attribute_prop_name);
    jerry_value_t print_it_prop_name = jerry_create_string((const jerry_char_t *) "print_it");
    jerry_release_value(print_it_prop_name);

    return new_jerry_value;    
} /* jerry_create_Complex_Calculator */


void register_function_call(jerry_value_t enclosing_object,
				   const char *function_name,
       			           jerry_external_handler_t handler)
{
  /* Create a JS function object and wrap into a jerry value */
  jerry_value_t function_object = jerry_create_external_function(handler);

  /* Set the native function as a property of the enclosing object
     (either the global object, or a user-define object) */
  jerry_value_t prop_name =
                 jerry_create_string((const jerry_char_t *) function_name);
  jerry_set_property(enclosing_object, prop_name, function_object);
  jerry_release_value(function_object);
  jerry_release_value(prop_name);
} /* register_function_call */

    /* add something meaningless to the ends of the name to ensure we
       don't write over a user name*/
static const char *q36 = "q36_interface_prototypes_holder_q36";
static const jerry_char_t q36_script[] = "var q36_interface_prototypes_holder_q36 = {};";
void create_interface_prototypes_holder()
{
    jerry_value_t new_prototypes_holder = jerry_create_object();
    jerry_value_t global_object = jerry_get_global_object();
    jerry_value_t prototype_holder_name =
                                jerry_create_string((const jerry_char_t *)q36);
    /* register the new object and immediately release jerry_value */
    jerry_release_value(jerry_set_property(global_object,
	                                   prototype_holder_name,
					   new_prototypes_holder));
    jerry_release_value(prototype_holder_name);
    jerry_release_value(global_object);
    jerry_release_value(new_prototypes_holder);
} /* create_interface_prototypes_holder */


/* helper function for the getter/setters, below */
static jerry_value_t get_prototypes_holder(void)
{
    jerry_value_t global_object = jerry_get_global_object();
    jerry_value_t prototypes_holder_property =
                             jerry_create_string((const jerry_char_t *)q36);
    jerry_value_t prototypes_holder = 
                  jerry_get_property(global_object, prototypes_holder_property);
    jerry_release_value(global_object);
    jerry_release_value(prototypes_holder_property);

    return prototypes_holder;
} /* get_prototypes_holder */

jerry_value_t get_prototype(char * interface_name)
{
    jerry_value_t prototypes_holder = get_prototypes_holder();
    jerry_value_t interface_property =
                     jerry_create_string((const jerry_char_t *)interface_name);
    jerry_value_t prototype = jerry_get_property(prototypes_holder,
                                                  interface_property);
    jerry_release_value(prototypes_holder);
    jerry_release_value(interface_property);

    return prototype;
} /* get_prototype */

void register_prototype(char * interface_name, jerry_value_t new_prototype)
{
    jerry_value_t prototypes_holder = get_prototypes_holder();
    jerry_value_t prop_name = jerry_create_string ((const jerry_char_t *) interface_name);
    /* set the prototype and release the return value without any check */
    jerry_release_value(jerry_set_property (prototypes_holder,
                                            prop_name, new_prototype));

    /* clean up */
    jerry_release_value(prototypes_holder);
    jerry_release_value(prop_name);
} /* register_prototype */




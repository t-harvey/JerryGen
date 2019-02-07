
#include "webidl_compiler_utilities_private.h"
#include "Buffer_private.h"

#define DEBUG_PRINTING 1

#include "Buffer_stubs.h"

/*********************** NATIVE-OBJECT FUNCTIONS ***********************/

Buffer_Native_Object *Buffer_Native_Object_create(void)
{
    Buffer_Native_Object *new_object = (Buffer_Native_Object *)malloc(sizeof(Buffer_Native_Object));

	/* USER CODE GOES HERE */
 
    return new_object;
} /* Buffer_Native_Object_create */

void Buffer_Native_Object_deallocator(void *native_object)
{
	/* USER CODE GOES HERE */

} /* Buffer_Native_Object_deallocator */



/******************* END OF NATIVE-OBJECT FUNCTIONS *******************/

/* Buffer */

/**
 *
 */ 
uint32_t Buffer_copy(Buffer this, Buffer target, uint32_t targetStart, uint32_t sourceStart, uint32_t sourceEnd, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"copy\" :\n");
   extern void debug_print_Buffer(char *, Buffer, unsigned int);
    debug_print_Buffer("target", target, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("targetStart", targetStart, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("sourceStart", sourceStart, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("sourceEnd", sourceEnd, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    uint32_t undefined_return_value = 0;
    debug_print_uint32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */




}; /* Buffer_copy */

/**
 *
 */ 
Buffer Buffer_fill(Buffer this, Buffer_or_long_or_string value, int32_t offset, int32_t end, string encoding, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"fill\" :\n");
   extern void debug_print_Buffer_or_long_or_string(char *, Buffer_or_long_or_string, unsigned int);
    debug_print_Buffer_or_long_or_string("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("end", end, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_string(char *, string, unsigned int);
    debug_print_string("encoding", encoding, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    return this;




}; /* Buffer_fill */

/**
 *
 */ 
uint8_t Buffer_readUInt8(Buffer this, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"readUInt8\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    uint8_t undefined_return_value = 0;
    debug_print_uint8_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_readUInt8 */

/**
 *
 */ 
int16_t Buffer_readUInt16BE(Buffer this, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"readUInt16BE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int16_t undefined_return_value = 0;
    debug_print_int16_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_readUInt16BE */

/**
 *
 */ 
int16_t Buffer_readUInt16LE(Buffer this, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"readUInt16LE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int16_t undefined_return_value = 0;
    debug_print_int16_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_readUInt16LE */

/**
 *
 */ 
int32_t Buffer_readUInt32BE(Buffer this, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"readUInt32BE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_readUInt32BE */

/**
 *
 */ 
int32_t Buffer_readUInt32LE(Buffer this, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"readUInt32LE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_readUInt32LE */

/**
 *
 */ 
string Buffer_to_string(Buffer this, string encoding, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return "";

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"to_string\" :\n");
   extern void debug_print_string(char *, string, unsigned int);
    debug_print_string("encoding", encoding, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    string undefined_return_value = "";
    debug_print_string("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */

}; /* Buffer_to_string */

/**
 *
 */ 
int32_t Buffer_write(Buffer this, string value, int32_t offset, int32_t length, string encoding, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"write\" :\n");
   extern void debug_print_string(char *, string, unsigned int);
    debug_print_string("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_int32_t(char *, int32_t, unsigned int);
    debug_print_int32_t("length", length, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_string(char *, string, unsigned int);
    debug_print_string("encoding", encoding, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */




}; /* Buffer_write */

/**
 *
 */ 
int32_t Buffer_writeUInt8(Buffer this, uint8_t value, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"writeUInt8\" :\n");
   extern void debug_print_uint8_t(char *, uint8_t, unsigned int);
    debug_print_uint8_t("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */


}; /* Buffer_writeUInt8 */

/**
 *
 */ 
int32_t Buffer_writeUInt16BE(Buffer this, uint16_t value, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"writeUInt16BE\" :\n");
   extern void debug_print_uint16_t(char *, uint16_t, unsigned int);
    debug_print_uint16_t("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */


}; /* Buffer_writeUInt16BE */

/**
 *
 */ 
int32_t Buffer_writeUInt16LE(Buffer this, uint16_t value, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"writeUInt16LE\" :\n");
   extern void debug_print_uint16_t(char *, uint16_t, unsigned int);
    debug_print_uint16_t("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */


}; /* Buffer_writeUInt16LE */

/**
 *
 */ 
int32_t Buffer_writeUInt32BE(Buffer this, uint32_t value, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"writeUInt32BE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */


}; /* Buffer_writeUInt32BE */

/**
 *
 */ 
int32_t Buffer_writeUInt32LE(Buffer this, uint32_t value, uint32_t offset, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	/* we return a (meaningless) default value here so the compiler doesn't complain */
        
	return 0;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"writeUInt32LE\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("value", value, DEBUG_INDENTATION_WIDTH);
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("offset", offset, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
#ifdef DEBUG_PRINTING
    /* CAUTION: this is undefined; it is used to allow us to compile the code
       without warnings */
    
    int32_t undefined_return_value = 0;
    debug_print_int32_t("RETURN_VALUE", undefined_return_value, 0);
    return undefined_return_value;
#endif /* DEBUG_PRINTING */


}; /* Buffer_writeUInt32LE */

/**
 *
 */ 
Buffer Buffer_Constructor_0(Buffer this, uint8_t_array initialValues, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"Constructor_0\" :\n");
   extern void debug_print_uint8_t_array(char *, uint8_t_array, unsigned int);
    debug_print_uint8_t_array("initialValues", initialValues, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    set_Buffer_length(this, initialValues.length);

    {
	/* ArrayBuffer's are defined in webidl_compiler_utilities */
	ArrayBuffer new_array_buffer;
	new_array_buffer.length = initialValues.length;
	new_array_buffer.data = malloc(sizeof(uint8_t)*new_array_buffer.length);
	for(int i = 0; i < initialValues.length; i++)
	    new_array_buffer.data[i] = initialValues.items[i];
	set_Buffer_buffer(this, new_array_buffer);
    }

    return this;

}; /* Buffer_Constructor_0 */

/**
 *
 */ 
Buffer Buffer_Constructor_1(Buffer this, uint32_t size, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"Constructor_1\" :\n");
   extern void debug_print_uint32_t(char *, uint32_t, unsigned int);
    debug_print_uint32_t("size", size, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    set_Buffer_length(this, size);
    {
	/* ArrayBuffer's are defined in webidl_compiler_utilities */
	ArrayBuffer new_array_buffer;
	new_array_buffer.length = size;
	new_array_buffer.data = malloc(sizeof(uint8_t)*size);
	for(int i = 0; i < size; i++)
	    new_array_buffer.data[i] = 0;
	set_Buffer_buffer(this, new_array_buffer);
    }

    return this;

}; /* Buffer_Constructor_1 */

/**
 *
 */ 
Buffer Buffer_Constructor_2(Buffer this, string initialString, Interpreter_Error_Type *_error)
{
    Buffer_Native_Object *native_object = Buffer_Native_Object_get(this, _error);
    if (*_error)
	return this;

#ifdef DEBUG_PRINTING
   printf("PARAMETERS TO \"Constructor_2\" :\n");
   extern void debug_print_string(char *, string, unsigned int);
    debug_print_string("initialString", initialString, DEBUG_INDENTATION_WIDTH);
#endif /* DEBUG_PRINTING */

    /* USER CODE GOES HERE */
    int length = strlen(initialString);
    set_Buffer_length(this, length);
    {
	/* ArrayBuffer's are defined in webidl_compiler_utilities */
	ArrayBuffer new_array_buffer;
	new_array_buffer.length = length;
	new_array_buffer.data = malloc(sizeof(char)*length);
	for(int i = 0; i < length; i++)
	    new_array_buffer.data[i] = initialString[i];
	set_Buffer_buffer(this, new_array_buffer);
    }

    return this;

}; /* Buffer_Constructor_2 */


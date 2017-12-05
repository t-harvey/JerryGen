var fs = require('fs');
var hogan = require('hogan.js');
var _ = require('lodash');

var CHoganHelpers = require("./CHoganHelpers.js");


/* opens and reads the Mustache file */
function getMustacheTemplate(templateName){
    let mustache_filename = __dirname+"/c-templates/"+templateName+".mustache";
    return fs.readFileSync(mustache_filename, {encoding: 'utf8'})
} /* getMustacheTemplate */


/*
Interface Code generation
 */

module.exports.genCString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate('interface')).render(context);
};


/*
Dictionary Code generation
 */

module.exports.genDictionaryString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate('dictionary')).render(context);
};


/*
Enum Code generation
 */

module.exports.genEnumString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate('enum')).render(context);
};


/*
Callback Code generation
 */

module.exports.genCallbackString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate('callback')).render(context);
}; /* genCallbackString */


/*
Dictionary Code generation
 */

module.exports.genDictionaryTypesString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;
    
    return hogan.compile(getMustacheTemplate("types")).render(context);
}; /* genDictionaryTypesString */



/*
Stubs Code generation
 */

module.exports.genStubsString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate("stubs")).render(context);
}; /* genStubsString */


/*
Utilities Code generation
 */

module.exports.genUtilitiesString = function(ast, moduleName, header_or_body)
{
    var context = CHoganHelpers.getContext(ast, moduleName);

    if (header_or_body === "generate_header")
	context.header = true;
    else /* header_or_body === "generate_body" */
	context.body = true;

    return hogan.compile(getMustacheTemplate("utilities")).render(context);
}; /* genUtilitiesString */


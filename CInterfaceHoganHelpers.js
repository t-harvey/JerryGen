var _ = require("lodash");
var CHoganHelpers = require("./CHoganHelpers.js");

module.exports.getContext = function(ast, moduleName, interfaceName){
  // add some more specific stuff
  var context = CHoganHelpers.getContext(ast, moduleName);

  // add the specific interface
  context = _.assign(context, ast.interfaces[interfaceName]);

  // add the include def name
  context = _.assign(context, { includeDefName: "PPRPCGEN_"+interfaceName.toUpperCase() });

  return context;
};

var _ = require("lodash");

module.exports.getContext = function(ast, moduleName){
  return {
      moduleName: moduleName,
      debug_printing: ast.debug_printing,
      externalTypes: ast.getExternalTypesArray(),
      timestamp: ""+(new Date()),
      utilities_filename: ast.utilities_filename,
      interfaces: ast.getInterfaceArray()
  };
};

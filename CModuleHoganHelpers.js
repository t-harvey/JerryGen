var _ = require("lodash");
var CHoganHelpers = require("./CHoganHelpers.js");

module.exports.getContext = function(ast, moduleName){
  var context = CHoganHelpers.getContext(ast, moduleName);
  context = _.assign(context, {
    numParams: function(){
      return (this.arguments ? this.arguments : []).length;
    }
  });

  return context;
};

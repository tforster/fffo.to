var path = require("path"), basePath = path.dirname(require.main.filename);
var url = require("url"),
   http = require("http"),
   https = require("https");


bulletTime = function (options) {
   var thisModule = this;
   this.options = options;

   this.init = function (options) {
      this.options = options;
   }
}

module.exports = new bulletTime();
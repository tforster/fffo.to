var path = require("path"), basePath = path.dirname(require.main.filename);

var express = require("express");
var router = express.Router();
var bulletTime = require(path.join(basePath, "/modules/bulletTime.js"));

byDefault = function (req, res) {
   res.render("index", {
      //pageData: tforster.pageData
   })
}

master = function (req, res) {
   res.render("master");

}

slave = function (req, res) {
   res.render("slave");

}
router.get("/", byDefault);
router.get("/master", master);
router.get("/slave", slave);

module.exports = router;
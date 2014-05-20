"strict mode"
var path = require("path"), basePath = path.dirname(require.main.filename);
var express = require("express"),
   nconf = require("nconf"),
   http = require("http"),
   ejs = require("ejs"),
   WebSocketServer = require("ws").Server;
   
// Get options from config.json and command line
nconf.file({
   file: path.join(basePath, "config.json")
}).argv();
var options = nconf.get();

var bulletTime = require(path.join(basePath, "/modules/bulletTime.js"));
bulletTime.init(options);

routes = require("./routes/routes.js");

// Express setup 
var app = express();
app.set("views", basePath + "/views");
app.engine(".html", require("ejs").__express);
app.set("view options", { layout: false });
app.set("view engine", "html");
app.use(express.static(path.join(basePath, options.directories.static)));

app.use("/", routes);

// 404 route
//app.use(function (req, res, next) {
//   var err = new Error("Not Found");
//   err.status = 404;
//   next(err);
//});

// development error handler will print stacktrace
//if (options.debug) {
//   app.use(function (err, req, res, next) {
//      res.status(err.status || 500);
//      res.render("error", {
//         message: err.message,
//         error: err
//      });
//   });
//}

// production error handler, no stacktraces leaked to user
//app.use(function (err, req, res, next) {
//   res.status(err.status || 500);
//   res.render("error", {
//      message: err.message,
//      error: {}
//   });
//});

var server = http.createServer(app).listen(options.port, function () {
   console.log("%s is listening on port %s", options.name, options.port);
});

var connections = {};
var connectionIDCounter = 0;

var wss = new WebSocketServer({ server: server });
wss.on("connection", function (ws) {
   ws.id = connectionIDCounter++;
   connections[ws.id] = ws;
   console.log("connect\n", connections);
 
   ws.on("message", function (data) {
      console.log("received: %s", data);
      var data = JSON.parse(data);
      if (data.cmd) {
         switch (data.cmd) {

            case "create_master":
               var autoPin = ("000" + Math.floor(Math.random() * 4999)).slice(-4);
               connections[ws.id].masterId = autoPin;
               connections[ws.id].isMaster = true;
               ws.send(JSON.stringify({ response: "master_created", masterId: autoPin }));
               console.log(connections);
               break;

            case "connect_master":
               connections[ws.id].masterId = data.masterId;
               ws.send(JSON.stringify({ response: "client_connected_to", masterId: data.masterId }));
               broadcast(JSON.stringify({ msg: "broadcasted message" }));
               console.log(connections);
               break;

            case "shutter":
               // rebroadcast to all related clients including self
               broadcast(JSON.stringify({ cmd: "shutter" }));
               break;

            case "image":
               // Add each incoming image to our connetions array
               connections[ws.id].imageData = data.imageData;
               //console.log(connections);
               // rebroadcast to our slaves and master
               broadcast(JSON.stringify({ cmd: "snap", imageData: data.imageData }));
               
               break;

            default:
               ws.send(JSON.stringify({ err: "no command found" }));
               break;
         }
      }
      else {
         console.error("no cmd found in", data);
      }
   });

   ws.on("close", function () {
      console.log("close\n", connections);
      if (connections[ws.id]) {
         delete connections[ws.id];
      }
      console.log(connections);
      // to-do: manage closed peer connections for both isMaster = true and isMaster = false;
   });


});

var broadcast = function (data, filter) {
   // to-do: implement some sort of Mongo like filter that can be used to match specific masterIds
   filter = filter || {};
   Object.keys(connections).forEach(function (id) {

      connections[id].send(data);
   });
}
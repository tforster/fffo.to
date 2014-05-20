var bt = bt || function () { }

bt.prototype.init = function() {
   // Check for UserMedia support, but generally assumed one we wrap in PhoneGap
   if (!!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)) {   
   } else {
      alert('getUserMedia() is not supported in your browser');
   }

   var host = window.document.location.host.replace(/:.*/, "");
   var ws = new WebSocket("ws://" + host + ":3203");

   // Video bits n pieces
   var video = document.querySelector("video");
   var canvas = document.querySelector("canvas");
   var ctx = canvas.getContext("2d");
   var localMediaStream = null;

   // Panels
   var paneVideo = document.getElementById("preview");
   var paneMaster = document.getElementById("paneMaster");
   var paneSlave = document.getElementById("paneSlave");
   var paneSettings = document.getElementById("paneSettings");

   // bind menu buttons
   document.getElementById("btnMaster").addEventListener("click", function (ev) {
      paneMaster.style.display = "";
      paneSlave.style.display = "none";
      paneSettings.style.display = "none";      
      video.style.display = "";
      ev.preventDefault;
   });
   document.getElementById("btnSlave").addEventListener("click", function (ev) {
      paneMaster.style.display = "none";
      paneSlave.style.display = "";
      paneSettings.style.display = "none";
      video.style.display = "";
      ev.preventDefault;
   });
   document.getElementById("btnSettings").addEventListener("click", function (ev) {
      paneMaster.style.display = "none";
      paneSlave.style.display = "none";
      paneSettings.style.display = "";
      video.style.display = "none";
      ev.preventDefault;
   });

   // Master buttons
   document.getElementById("btnCreateMaster").addEventListener("click", function (ev) {
      ws.send(JSON.stringify({ cmd: "create_master" }));
      ev.preventDefault();
   });

   document.getElementById("btnConnectMaster").addEventListener("click", function (ev) {
      ws.send(JSON.stringify({ cmd: "connect_master", "masterId": document.getElementById("pinClient").value }));
      ev.preventDefault();
   });

   document.getElementById("btnShutter").addEventListener("click", function (ev) {
      ws.send(JSON.stringify({ cmd: "shutter" }));
      ev.preventDefault();
   });

   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
   var hdConstraints = {
      video: {
         mandatory: {
            minWidth: 640,
            minHeight: 480
         }
      }
   };
   
   if (navigator.getUserMedia) {
      navigator.getUserMedia(
         hdConstraints,
         function (stream) {
            video.src = window.URL.createObjectURL(stream);
            localMediaStream = stream;
         },
         function (e) {
            console.log('denied!', e);
      });
   }


   ws.onmessage = function (event) {
      console.log("ws.onmessage", event);
      var clients = document.getElementById("clients");
      var thumbs = document.getElementById("thumbs");
      var data = JSON.parse(event.data);

      // Informational responses
      switch (data.response) {

         case "master_created":
            console.log("master created with", data.masterId);
            document.getElementById("pinMaster").value = data.masterId;
            break;

         case "client_connect":
            var li = document.createElement("li");
            li.setAttribute("data-clientId", data.clientId);
            li.innerHTML = data.clientName;
            clients.appendChild(li);
            break;

         default:
            break;
      }

      // Actionable commands
      switch (data.cmd) {
         case "shutter":
            console.log("snap");
            if (localMediaStream) {
               ctx.drawImage(video, 0, 0);
               //document.querySelector("img").src = canvas.toDataURL("image/webp");
               ws.send(JSON.stringify({ cmd: "image", imageData: canvas.toDataURL("image/png") }));
            }
            else {
               console.error("no localmediastrea");
            }
            break;

         case "snap":
            var img = document.createElement("img");
            console.log(img);
            img.src = data.imageData;
            thumbs.appendChild(img);
            break;

         default:
            break;
      }
   };
}



document.addEventListener("DOMContentLoaded", function () {
   var s = new bt();
   s.init();
});
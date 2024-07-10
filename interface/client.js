//This server is supposed to act an interface between the Python server and the browser-based GUI, to serve it to multiple clients.


//NOTICE: this client acts only as a buffer between multiple control clients and the python server, just repeating messages and managing connections (with keepalives)
//all the protocol logic is contained in the python client and the js client

//Set this to false if you want to connect with an external device
var USE_LOCALHOST = true;

var currentConnection;

var WebSocketServer = require('websocket').server;
var os = require('os');

//DO NOT TOUCH
var remote_read_port = 65300

var BACKEND_CLIENT_ID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

var BACKEND_INACTIVE = true;
var BACKEND_KEEPALIVE_SEND_INTERVAL = 4000;
var BACKEND_KEEPALIVE_RECEIVE_INTERVAL = 2000;

LOCAL_BACKEND_IP = "127.0.0.1"

LOCAL_BACKEND_READ_PORT = 65301;
LOCAL_BACKEND_WRITE_PORT = 65300;

//Taken from https://stackoverflow.com/questions/10750303/how-can-i-get-the-local-ip-address-in-node-js
if(USE_LOCALHOST)
{
  LOCAL_IP = "127.0.0.1"
}
else
{
  //Get local IP address
  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
          var address = interfaces[k][k2];
          if (address.family === 'IPv4' && !address.internal) {
              addresses.push(address.address);
          }
      }
  }
  LOCAL_IP = addresses[0]
}
if(LOCAL_IP == undefined)
{
  console.log("No network connection detected, switching to localhost")
  LOCAL_IP = "127.0.0.1"
}
console.log(LOCAL_IP)

//Compute client id as hex hash of the address
var crypto = require('crypto');
var client_id = crypto.createHash('md5').update(LOCAL_IP + LOCAL_BACKEND_READ_PORT).digest('hex');

const dgram = require('dgram');
const read_socket = dgram.createSocket('udp4');

read_socket.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  read_socket.close();
});

read_socket.on('message', (message, rinfo) => {
  
  BACKEND_INACTIVE = false;
  
  //console.log(`[BACKEND] Received message: ${message} from ${rinfo.address}:${rinfo.port}`)
  message_fields = message.toString().split("|")
  //console.log(message_fields);
  var message_string = message_fields[0];
  
  message_header = message_fields[0]
  //console.log(message_header)
  message_content = message_fields[1]
  //console.log(message_content)

  headerFields = message_header.split(";")

  var receivedRobotNumber;
  
  if(currentConnection != undefined)
  {
    if((currentRobotNumber!=undefined && receivedRobotNumber == currentRobotNumber) || (currentTeammateRobotNumber!=undefined && receivedTeammateRobotNumber == currentTeammateRobotNumber))
    {
      if(message_content.startsWith("disableClient"))
      {
        //console.log("disableClient")
        currentConnection.sendUTF(generateWebSocketHeader() + "disableClient")
        console.log("generateWebSocketHeader()"+ message_content)

      }
      else
      {
        console.log(generateWebSocketHeader()+ message_content)
        //console.log("Received robot number: "+currentRobotNumber+", Current robot number: "+currentRobotNumber)
        currentConnection.sendUTF(generateWebSocketHeader() + message_content)
      }
    }
  }
});

read_socket.on('listening', () => {
  const address = read_socket.address();
  console.log(`[BACKEND; SETUP] Backend communication socket listening ${address.address}:${address.port}`);
});

read_socket.bind(65301);

//Write socket
function generateHeader()
{
  return Buffer.from('client_id,'+LOCAL_IP+','+LOCAL_BACKEND_READ_PORT+','+client_id+'|');
}

function send_registration_message_to_backend()
{
  //Register this server in the backend
  var message_header = generateHeader();
  var message_content = "uthere?"

  var message = message_header + message_content
  write_socket.send(message, 65300, LOCAL_BACKEND_IP, (err) => {});
}

var backend_keepalive_receive_timeout;
var backend_keepalive_send_timeout;
function requestKeepaliveToBackend() {
    
  //console.log("[FRONTEND; KEEPALIVE] Requesting keepalive to backend")
  //send_registration_message_to_backend()

  //Set a timeout to be cleared in case a keepalive is received
  backend_keepalive_receive_timeout = setTimeout(function () {
      //If this is executed, the server failed to respond to the keepalive
      BACKEND_INACTIVE = true;
  }, BACKEND_KEEPALIVE_RECEIVE_INTERVAL);
}

var write_socket = dgram.createSocket('udp4');
backend_keepalive_send_timeout = setInterval(requestKeepaliveToBackend, BACKEND_KEEPALIVE_SEND_INTERVAL)





// ---------------------
// | Client WebSockets |
// ---------------------


LOCAL_FRONTEND_WEBSOCKET_PORT = 4000;

function generateWebSocketHeader()
{
  return "TOCLIENT!"
}

//Setup Web GUI
//Taken from https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61
var http = require('http');

var httpWebSocketServer = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
httpWebSocketServer.listen(LOCAL_FRONTEND_WEBSOCKET_PORT, function() { });
console.log("[FRONTEND; SETUP] Frontend WebSocket listening:\n \
\t Address: "+LOCAL_IP+":"+LOCAL_FRONTEND_WEBSOCKET_PORT+"\n")

// create the server
webSocket = new WebSocketServer({
  httpServer: httpWebSocketServer,
  //keepalive: true,
  //keepaliveInterva: 5000,
  //keepaliveGracePeriod: 5000,
  //autoAcceptConnections: true
});

var currentClientID = undefined;
var currentRobotNumber = undefined;
var currentTeammateRobotNumber = undefined;
var currentConnection = undefined;
var waitingConnections = [];


// WebSocket server
webSocket.on('request', function(request) {

  receivedConnection = request.accept(null, request.origin);

  console.log("[FRONTEND; CONNECTION] Received connection from:\n\n \
\tReceived address:"+request.origin+"\n\n");

  //If no client is connected right now, set the request as the current connection
  //else tell the client another client is already connected and he's disabled for now
  if(currentConnection == undefined)
  {
    currentConnection = receivedConnection;
  }
  else
  {
    receivedConnection.sendUTF("disableClient")
    waitingConnections.push(receivedConnection)
  }

  console.log('[FRONTEND; CONNECTION] Connection accepted.');
  receivedConnection.on('message', function(message) {
      if (message.type === 'utf8') {
        
        if(message.utf8Data == undefined) return;

        //console.log('[FRONTEND] Received Message: ' + message.utf8Data);
        
        //Skip messages that I sent (to the client)
        if(message.utf8Data.split("!")[0] == "TOCLIENT") return;
        
        message_fields = message.utf8Data.split("!")[1].split("|")
        //console.log("Received message:" + message_fields)
        
        message_header = message_fields[0]
        message_content = message_fields[1]
        //console.log("header: " + message_header)
        //console.log("content: " + message_content)

        receivedClientID = message_header.split(";")[0].split(",")[1]
        receivedRobotNumber = message_header.split(";")[1].split(",")[1]
        receivedTeammateRobotNumber = message_header.split(";")[2].split(",")[1]
        //console.log(receivedClientID)
        //console.log(currentClientID)
        
        if(currentClientID == undefined) 
        {
          currentClientID = receivedClientID;
          currentRobotNumber = receivedRobotNumber;
          currentTeammateRobotNumber = receivedTeammateRobotNumber;
          currentConnection = receivedConnection;
          //console.log("[FRONTEND; REGISTERING] Registering new web interface client (ID: "+currentClientID+", Robot number: "+currentRobotNumber+")")
          //console.log("[FRONTEND; REGISTERING] Registering new web interface client (ID: "+currentClientID+", Robot number: "+currentTeammateRobotNumber+")")
        }
        else if(currentClientID != receivedClientID)
        {
          console.log("[FRONTEND; REGISTERING] One client is already connected. Disabling new client (ID: "+receivedClientID+")")
          receivedConnection.sendUTF(generateWebSocketHeader() + "disableClient")
          return;
        }
        if(message_content === "uthere?")
        {
          try{
            //console.log(message_content)
            //write_socket.send(generateHeader() + message_content, 65300, LOCAL_BACKEND_IP, (err) => {});
          } catch {}
          //console.log(obstaclesPositions)
          //console.log("[FRONTEND; KEEPALIVE] Received keepalive from client (ID: "+receivedClientID+"). Sending response.")
          receivedConnection.sendUTF(generateWebSocketHeader() + "yeah")
        }
        else if(message_content.startsWith("Undo")) {
          var message_fields = message_content.split(":")[1]
          console.log(message_fields)
          try{
            //console.log(generateHeader() + message_content)
            console.log(generateWebSocketHeader() + "Undo:" + message_fields)
            //currentConnection.sendUTF(generateWebSocketHeader() + "lastReceivedStrategy:" + strategyID + "," + strategyType)
            //write_socket.send(generateHeader() + message_content, 65300, LOCAL_BACKEND_IP, (err) => {});
          } catch {}
        }
        
        else if(message_content.startsWith("taskType"))
        {
          //console.log(message_content)
          var message_fields = message_content.split(":")[1].split(",")

          var selectionMode = message_fields[1]
          var taskType = message_fields[2]
          var taskID = message_fields[3]
          var taskLabel = message_fields[4]
          var strategySelected = message_fields[5]
          if(selectionMode === "noSelection")
          {
            console.log("[FRONTEND] Received new task from client (ID: "+receivedClientID+"). taskType: "+ taskType +", taskID: "+taskID + ", Task label: "+taskLabel + ", Strategy selected: "+strategySelected)
          }
          else
          {
            var xPos = Math.floor(parseFloat(message_fields[6]))
            var yPos = Math.floor(parseFloat(message_fields[7]))
            console.log("[FRONTEND] Received new task from client (ID: "+receivedClientID+"). taskType: "+ taskType +", taskID: "+taskID+ ", Task label: "+taskLabel + ", selectionMode: "+selectionMode+", position ("+xPos+","+yPos+")")
          }

          try{
            //console.log(generateHeader() + message_content)
            console.log(generateWebSocketHeader() + "lastReceivedTask:" + taskID + taskType)
            currentConnection.sendUTF(generateWebSocketHeader() + "lastReceivedTask:" + taskID + "," + taskType + "," + strategySelected)
            write_socket.send(generateHeader() + message_content, 65300, LOCAL_BACKEND_IP, (err) => {});
          } catch {}
          
        }
      }
  });

  receivedConnection.on('close', function(connection) {
    //console.log("[FRONTEND] Closing connection")
    if(waitingConnections.length > 0)
    {
      currentConnection = waitingConnections.shift();
      currentConnection.sendUTF("enabled")
    }
    else
    {
      currentConnection = undefined;
    }
    currentClientID = undefined;
    currentRobotNumber = undefined;
  });
});



// ---------------------
// |   Serve WebPage   |
// ---------------------

const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '../python/received_image.jpg');
const express = require('express');
const app = express();

const LOCAL_FRONTEND_GUI_PORT = 3000

// Serve static files
app.use(express.static(__dirname));

// Serve the image
app.get('/image', (req, res) => {
    fs.readFile(imagePath, (err, data) => {
        if (err) {
            console.error('Error reading the image file:', err);
            res.status(500).send('Error reading the image file');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
    });
});

app.get('*', (req, res) => {
    fs.readFile(path.join(__dirname, 'webGUI.js'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading the JS file');
            return;
        }

        // First modify the js script to use the correct local IP
        data = `var SERVER_IP = '${LOCAL_IP}';\nconsole.log(SERVER_IP);\n${data}`;

        // Write it as a new file
        fs.writeFile(path.join(__dirname, 'webGUIWithCorrectAddress.js'), data, {}, () => {
            // Then serve the HTML page
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(path.join(__dirname, 'webGUI.html')).pipe(res);
        });
    });
});

app.listen(LOCAL_FRONTEND_GUI_PORT, () => {
    console.log(`[FRONTEND; SETUP] Frontend webGUI server listening:\n\t Address: ${LOCAL_IP}:${LOCAL_FRONTEND_GUI_PORT}\n`);
});


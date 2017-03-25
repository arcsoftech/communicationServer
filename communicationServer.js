var net = require('net'),JsonSocket = require('json-socket');
var bodyParser = require('body-parser'),json_body_parser = bodyParser.json();
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 9000);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = app.get('port');
app.use(bodyParser.json());
app.use(express.static('public'));
server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s", port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var usernames = {};
var rooms = [];
var response={"flag":0,"message":""};

io.sockets.on('connection', function (socket) {
    
    socket.on('adduser', function (data) {
        var username = data.username;
        var room = data.room;
        console.log(rooms);
		var result  = rooms.find(o => o.roomid === room);
        if (result.length!=0) {
            socket.username = username;
            socket.room = room;
            usernames[username] = username;
            socket.join(room);
            socket.emit('updatechat', 'SERVER', 'You are connected. Please wait for any user query.');
            //socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        } else {
            socket.emit('updatechat', 'SERVER', 'Please enter valid code.');
        }
    });
    
    socket.on('createroom', function (data) {
        var new_room = ("" + Math.random()).substring(2, 7);
		var room={
			'username':data.username,
			'roomid':new_room,
			'status':1,
			'coversationId':''
		}
        rooms.push(room);
        data.room = new_room;
        socket.emit('updatechat', 'SERVER', 'Your room is ready, using this ID:' + new_room);
        socket.emit('roomcreated', data);

    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });
	socket.on('sendapi', function (data) {
		var port = 9838; //The same port that the server is listening on
		var host = '127.0.0.1';
		var socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket
		socket.connect(port, host);
        response.flag=1;
		response.message=data;
		console.log(response);
		socket.on('connect', function() 
		{ //Don't send until we're connected
			socket.sendMessage(response);
			socket.on('message', function(message) 
			{
				console.log('The result is: '+message.result);
			});		
		});
    });
     
    socket.on('disconnect', function () {
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        if (socket.username !== undefined) {
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
            socket.leave(socket.room);
        }
    });
	
	socket.on('timeout',function(data){
		for(var i=0;i<rooms.length;i++)
			 {
				 if(rooms[i].username==data)
				 {
					 rooms[i].status=1;
					 rooms[i].conversationId="";
					 break;
				 }
			 }
	});
	
	  
	
});


app.post('/sendtohelpdesk',json_body_parser,function(req,res){
	console.log(req.body);
		var availRoom=rooms.find(o => o.status === 0 && o.conversationId === req.body.sessionId);
		console.log(availRoom);
		if(availRoom!=undefined && availRoom.length!=0)
		{
			io.sockets.in(availRoom.roomid).emit('updatechat', "Customer", req.body.query);
			//res.end();
						
		}
		else
		{	
	
		availRoom=rooms.find(o => o.status === 1 && o.coversationId === "");
		if(availRoom!=undefined  && availRoom.length!=0)
		{
			 for(var i=0;i<rooms.length;i++)
			 {

				 if(rooms[i].roomid==availRoom.roomid)
				 {
					 rooms[i].status=0;
					 rooms[i].conversationId=req.body.sessionId;
					 break;
				 }
			 }
			io.sockets.in(availRoom.roomid).emit('updatechat', "Customer", req.body.query);
			res.end();
			
		}
		else
		{
			res.end(JSON.stringify("We are soory there is no helpdesk executive available right now.PLease try after sometime."))
		}
		}
		
		res.end();
			
						
});

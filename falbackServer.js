/*
 *Author:Arihant Chhajed
 *Language:Node.JS
 *License:Free
*/


//Initialization
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var json_body_parser = bodyParser.json();//this is used to prevent empty reponse in api.ai
var request = require('request');
app.use(bodyParser.json());
var path    = require("path");
const proxy='http://proxy.tcs.com:8080';// or blank for without proxy
//const proxy = '';
app.post('/fallback',json_body_parser, function (req, res) //2nd parameter is used to prevent empty string error in api.ai
{
	res.set('Content-Type', 'application/json');
	
	 var fulfillment=
		{
			"speech": "fallback occured connected to fallbackServer",
			"source": "Arcsoftech-Webhook",
			"displayText": "fallback occured connected to fallbackServer"
		}
	res.end(JSON.stringify(fulfillment));
});


app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
   response.sendFile(path.join(__dirname+'/template.html'));
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

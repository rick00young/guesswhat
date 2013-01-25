var startx = 0;
var starty = 0;
var canvas = document.getElementById('drawing');
var ctx = canvas.getContext('2d');
// 0 聊天内容
// 1 画布数据
$(function() {
    "use strict";
 
    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');
 
    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
 
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }
 
    // open connection
    var connection = new WebSocket('ws://192.168.0.144:1337');
	window.connection = connection; 
    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('请输入用户名:');
    };
 
    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.</p>' } ));
    };
 
    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
			console.log(message);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }	
 
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
		//alert(JSON.stringify(json));
        if (json.type === 'color') { // first response from the server with user's color
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message	ctx.fil
            input.removeAttr('disabled'); // let the user write another message
            addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time));
        } else if(json.type === 'canvas'){
			$('#content').text(JSON.stringify(json));
			var canvas = document.getElementById('drawing');
			var ctx = canvas.getContext('2d');
			ctx.beginPath();
			ctx.strokeStyle = '#444';
			ctx.moveTo(json.data.startx, json.data.starty);
			ctx.lineTo(json.data.mousex, json.data.mousey);
			ctx.stroke();
			$('#content').append(json.data.startx + '---' + json.data.starty + '---' +
					json.data.mousex + '---' + json.data.mousey
				);
		}else{
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };
 
    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
			var data = {};
			data.dataType = 0;
			data.msg = msg;
			//alert(JSON.stringify(data));
            connection.send(JSON.stringify(data));
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');
 
            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });
 
    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);
 
    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '">' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
    }

	draw()
});

var isDrawing = false;

function draw(){


	$('#drawing').mousedown(function(event){
			var pos = $(this).offset();
			 startx = event.clientX;
			 starty = event.clientY;
			ctx.beginPath();
			ctx.moveTo(startx, starty);
			drawline(ctx, startx, starty);
			isDrawing = true;
		});
	
	$('#drawing').mousemove(function(e){
				ctx.stroke();
			if(isDrawing){
				var $this = $(this);
				var timer;
				var mousex = e.pageX-$(this).position().left;
				var mousey = e.pageY-$(this).position().top;
		
				ctx.strokeStyle = '#444';
	
				ctx.lineTo(e.pageX-$(this).position().left,e.pageY-$(this).position().top);
				ctx.stroke();
				var data = {};
				data.dataType = 1;
				data.startx = startx;
				data.starty = starty;
				data.mousex = mousex;
				data.mousey = mousey;
				//$('#content').text(JSON.stringify(data));
				connection.send(JSON.stringify(data));
				startx = mousex;
				starty = mousey;
			}
		});

	$('#drawing').mouseup(function(e){
			isDrawing = false;
			//alert('up');
			//startx = e.page;
			//starty = (e.pageY < 200) ? e.pageY : 200;
			//$('#content').html(startx + '-' + starty + '-' + isDrawing +'<br>');
			//clearInterval(timer);
		});
}

function loop(){
	
}

function drawline(ctx, x1, y1, x2, y2,thickness){
	ctx.lineTo(x2, y2);
	ctx.lineWidth = thickness;
	ctx.strokeStyle = '#444';
}


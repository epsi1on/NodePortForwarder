//programs listens on addr.from port, when new income, pipes the
//income connection to addr.to, also encrypt it with simple xOr something!
var net = require('net');
var addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

var fs = require('fs');
var json_data = JSON.parse(require('fs').readFileSync(__dirname + '/conf.json'));

var argv = require('minimist')(process.argv.slice(2));

var listenOn = argv.l || process.env.l || json_data.forwarder.listenOn;
if (listenOn != null) listenOn = listenOn.match(addrRegex);

var forwardTo = argv.f || process.env.f || json_data.forwarder.forwardTo;
if (forwardTo != null) forwardTo = forwardTo.match(addrRegex);

var action = argv.a || process.env.a || json_data.forwarder.action;

if (action != null) action = action.toLowerCase();

var verbLevel = argv.v || json_data.forwarder.verbLevel || 0;

var obfuscate = argv.o || json_data.forwarder.obfuscate || 0;

if(obfuscate == true)
	obfuscate = true;

if(obfuscate == false)
	obfuscate = false;


if (verbLevel >= 1)
    var verbose = true;

if (verbLevel >= 2)
    var vverbose = true;

var connectionLog = {};

//console.log(argv);
var httpResponse = 'HTTP/1.1 200 OK\nConnection: close\nContent-Length: 118\n\n<html><head><title>An Example Page</title></head><body>Hello World, this is a very simple HTML document.</body></html>';

var httpRequest = 'GET / HTTP/1.1\nHost: www.example.com';



function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

if (listenOn == null || forwardTo == null || action == null) {
    console.log('Usage1: node forward.js -l "listen_socket" -f "forward_socket" -a "action" o');
    console.log('   listen_socket: socket to listen on');
    console.log('   forward_socket: socket to forward into');
    console.log('   action: the action, three possible values: encrypt, decrypt, none');
	console.log('   o: does some obfuscation!');
    console.log('example: node forward.js -l "127.0.0.1:8080" -f "127.0.0.1:80" -a "encrypt"');
    console.log('above example will listen on 127.0.0.1:8080 and forwards connections into 127.0.0.1:80 and encrypt data');
    console.log('Usage2: node forward.js');
    console.log('above example will read configs from conf.json file');

    console.log('hovewer the IP list of this host is:'); {
        'use strict';

        var os = require('os');
        var ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function(ifname) {
            var alias = 0;

            ifaces[ifname].forEach(function(iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    //return;
                    //console.log(iface);
                }

                if (alias >= 1) {
                    // this single interface has multiple ipv4 addresses
                    console.log(' - ' + ifname + ':' + alias, iface.address);
                } else {
                    // this interface has only one ipv4 adress
                    console.log(' - ' + ifname, iface.address);
                }
                ++alias;
            });
        });

    }

    console.log();
    //publicIp.isIPv4
} else {
    console.log('Node Port Forwarder Listening on: ' + listenOn[0]);
    console.log('Node Port Forwarder Forwarding to: ' + forwardTo[0]);
    console.log('Node Port Forwarder Action: ' + action);
	console.log('Node Port Forwarder Obfuscate: ' + obfuscate);
    console.log('Node Port Forwarder Started Successfully ...');
    if (verbose)
        console.log('Verbose mode');

    if (vverbose)
        console.log('Verbose^2 mode');

    var options = {
        ListenOn: {
            Host: listenOn[2],
            Port: listenOn[3]
        },

        ForwardTo: {
            Host: forwardTo[2],
            Port: forwardTo[3]
        },

        Action: action
    }

    var srv;
    srv = net.createServer(function(from) {

        var ended = false;
		
		
        if (verbose)
            console.log('incoming connection @ ' + Date.now().toString());

        var to = net.createConnection({
            host: options.ForwardTo.Host,
            port: options.ForwardTo.Port
        });
		
		if(obfuscate == true)
			to.write(new Buffer(httpRequest));
        /**/
        function closeSession() {
            to.destroy();
            from.destroy();
            ended = true;
            //delete to;
        }

        function updateStats() {
            connectionLog[from.remoteAddress] = from.bytesRead + to.bytesWritten;
        }

        var firstfromRead = true;

        from.on('data', function(chunk) {

		    if(firstfromRead){
				firstfromRead = false;
				//console.log(chunk.toString('utf8'))
				if (chunk.length != 3)
					if (chunk.length > 4)
				 if (chunk[0] == 71 && chunk[1] == 69 && chunk[2] == 84 && chunk[3] == 32)
				 {
					 from.write(new Buffer(httpResponse));
					 return;
				 }
					 
			}
			
            if (ended)
			{
				closeSession();
				return;
			}

            if (verbose) {
                console.log('received ' + chunk.length + " bytes from " + options.ListenOn.Host + ':' + options.ListenOn.Port);
                var dt = '';

                if (vverbose) {
                    for (var i = 0; i < chunk.length; i++) {
                        dt += "0x" + chunk[i].toString(16) + " ";
                    }
                    console.log(dt);
                }
            }
			

			var old = connectionLog[from.remoteAddress];
			
			if(!old)
				old = 0;
            
			connectionLog[from.remoteAddress] = old + 2*chunk.length;

			
            if (action == "encrypt")
                encode(chunk);

            if (action == "decrypt")
                decode(chunk);

            if (verbose) {
                console.log('sending ' + chunk.length + " bytes to " + options.ForwardTo.Host + ':' + options.ForwardTo.Port);
                var dt = '';
                if (vverbose) {
                    for (var i = 0; i < chunk.length; i++) {
                        dt += "0x" + chunk[i].toString(16) + " ";
                    }
                    console.log(dt);
                }
            }

            try {
                to.write(chunk);
            } catch (error) {
                console.error('There was an error sending data upward', error);
            }

        });
        from.on('end', function() {
            closeSession();
        });
        from.on('error', function() {
            closeSession();
        });

		var firstToRead = true;
		
        to.on('data', function(chunk) {

			if(firstToRead){
				firstToRead = false;
				if(obfuscate)
				 if (chunk.toString('utf8').startsWith('HTTP/'))
					 return;
			}
			
            if (ended)
			{
				closeSession();
				return;
			}

            if (verbose) {
                console.log('received ' + chunk.length + " bytes from " + options.ForwardTo.Host + ':' + options.ForwardTo.Port);
                var dt = '';
                if (vverbose) {
                    for (var i = 0; i < chunk.length; i++) {
                        dt += "0x" + chunk[i].toString(16) + " ";
                    }
                    console.log(dt);
                }
            }

            //updateStats();
			var old = connectionLog[from.remoteAddress];
			
			if(!old)
				old = 0;
            
			connectionLog[from.remoteAddress] = old + 2*chunk.length;
			

            if (action == "encrypt")
                decode(chunk);

            if (action == "decrypt")
                encode(chunk);

            if (verbose) {
                console.log('sending ' + chunk.length + " bytes to " + options.ListenOn.Host + ':' + options.ListenOn.Port);
                var dt = '';
                if (vverbose) {
                    for (var i = 0; i < chunk.length; i++) {
                        dt += "0x" + chunk[i].toString(16) + " ";
                    }
                    console.log(dt);
                }
            }

            try {
                from.write(chunk);
            } catch (error) {
                console.error('There was an error sending data backward', error);
            }

        });
        to.on('end', function() {
            closeSession();
        });
        to.on('error', function() {
            closeSession();
        });

    });

    var res = srv.listen(options.ListenOn.Port, options.ListenOn.Host);

    var http = require('http');
    var url = require('url');

    if (json_data.cpanel.port)
        http.createServer(function(req, res) {
            var queryData = url.parse(req.url, true).query;
            var authorized = false;
            var sentSec = '';

            if (queryData.secret)
                sentSec = queryData.secret;

            var h1 = require('crypto').createHash('md5').update(sentSec).digest('hex');
            var h2 = require('crypto').createHash('md5').update(h1).digest('hex');

            authorized = (h2 == json_data.cpanel.secretDoubleMd5);

            if (authorized) {
                res.write('<html> Bandwidth Usage by IP: </br>');

                for (var k in connectionLog) {
                    if (connectionLog.hasOwnProperty(k)) {

                        res.write('<p>' + k + ':' + formatBytes(connectionLog[k], 2));
                        //alert("Key is " + k + ", value is" + target[k]);
                    }
                }
                res.write('</html>');
            } else {
                res.write('<html><h1>404 not found!!!</h1></html>'); //write a response to the client
            }

            res.end(); //end the response
        }).listen(json_data.cpanel.port); //the server object listens on port 80


    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        process.exit();
    });

    process.on('uncaughtException', function(err) {
        console.log(err);
    })


}

var encKey = json_data.forwarder['encKey'] || 128;

function encode(data) {
    for (var i = 0; i < data.length; i++) {
        data[i] = data[i] ^ encKey; //simple Xor logical gate
    }

    if (verbose)
        console.log("encrypting data");
}

function decode(data) {
    for (var i = 0; i < data.length; i++) {
        data[i] = data[i] ^ encKey; //simple Xor logical gate
    }

    if (verbose)
        console.log("decrypting data");
}
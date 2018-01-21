//programs listens on addr.from port, when new income, pipes the
//income connection to addr.to, also encrypt it with simple xOr something!



var net = require('net');
var addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

var argv = require('minimist')(process.argv.slice(2));

var listenOn = argv.l==null?null:argv.l.match(addrRegex);
var forwardTo =  argv.f==null?null:argv.f.match(addrRegex);
var action = argv.a;

if(listenOn == null || forwardTo == null || action == null)
{
    console.log('Usage: node forward.js -l "listen_socket" -f "forward_socket" -a "action"');
    console.log('   listen_socket: socket to listen on');
    console.log('   forward_socket: socket to forward into');
    console.log('   action: the action, three possible values: encrypt, decrypt, none');
    console.log('example: node forward.js -l "127.0.0.1:8080" -f "127.0.0.1:80" -a "encrypt"');
    console.log('above example will listen on 127.0.0.1:8080 and forwards connections into 127.0.0.1:80 and encrypt data');
    return;
}
else
{
    console.log('listening on: ' + listenOn[0]);
    console.log('forwarding to: '+ forwardTo[0]);
    console.log('action: '+ action);
    console.log('port forwarder started successfully ...');
}


options = {
    ListenOn:{
        Host:listenOn[2],
        Port:listenOn[3]
    },

    ForwardTo:{
        Host:forwardTo[2],
        Port:forwardTo[3]
    },
}

var srv = net.createServer(function(from) {
    var to = net.createConnection({
        host: options.ForwardTo.Host,
        port: options.ForwardTo.Port
    });

    from.on('data', function(chunk) {
        if(options.Action.toLowerCase() == "encrypt")
            encode(chunk);

        if(options.Action.toLowerCase() == "decrypt")
            decode(chunk);

        to.write(chunk);
    });
    from.on('end', to.end);


    to.on('data', function(chunk) {
        if(options.Action.toLowerCase() == "encrypt")
            decode(chunk);

        if(options.Action.toLowerCase() == "decrypt")
            encode(chunk);

        to.write(chunk);
    });
    to.on('end', from.end);

    //from.pipe(to);
    //to.pipe(from);

})
    if(options.ListenOn.Host!=null)
        srv.listen(options.ListenOn.Port);
    else
        srv.listen(options.ListenOn.Port, options.ListenOn.Host);

function encode(data)
{
    for(var i=0;i<data.length;i++)
    {
        data[i]=255-data[i];//simple NOT logical gate
    }
}

function decode(data)
{
    for(var i=0;i<data.length;i++)
    {
        data[i]=255-data[i];//simple NOT logical gate
    }
}


process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    process.exit();
});
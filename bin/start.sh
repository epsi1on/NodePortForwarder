local_ip="$(ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')"
echo please enter the other side socket address
read remote_socket

cd /home && mkdir nodefw && cd nodefw

rm -rf NodePortForwarder

git clone https://github.com/epsi1on/NodePortForwarder.git

local_socket = "$local_ip:8080"

node NodePortForwarder/bin/forwarder.js -l "$local_socket" -f "$remote_socket" -a "encrypt"
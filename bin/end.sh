local_ip="$(ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')"
remote_socket="127.0.0.1:9150"
local_socket = "$local_ip:8080"

cd /home && mkdir nodefw && cd nodefw

rm -rf NodePortForwarder && rm -rf NodeSocks5Server

git clone https://github.com/epsi1on/NodePortForwarder.git && git clone https://github.com/epsi1on/NodeSocks5Server.git

cd NodeSocks5Server && npm install socks-proxy@1.0.0 && cd ..

node NodeSocks5Server/bin/socksserver.js -l "127.0.0.1:9150" &
node NodePortForwarder/bin/forwarder.js -l "$local_socket" -f "$remote_socket" -a "decrypt"
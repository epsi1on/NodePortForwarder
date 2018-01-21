Node.JS Port Forwarder
======================
A simple port forwarder for Node with ability to encrypt/decrypt bytes (simple NOT Logical Gate implemented). If used as a pair, it can act as a encrypted tunnel.



Usage
=======
Usage:
```node forward.js -l "listen_socket" -f "forward_socket" -a "action"```

- listen_socket : Forwarder listen on this socket for income connection.
- forward_socket : Once new connection arrived at ``ListenTo`` socket, forwarder will accept it and pipe the income socket into this socket.
- action : Three possible values (case insensitive):



	```encrypt```:

		1 - When receives data from ``listen_socket`` socket, Encrypt it, then send it to ``forward_socket`` socket.

		2 - When receives data from ``forward_socket`` socket, Decrypt it, then send it to ``listen_socket`` socket.



	```decrypt```:

		1 - When receives data from ``listen_socket`` socket, Decrypt it, then send it to ``forward_socket`` socket.

		2 - When receives data from ``forward_socket`` socket, Encrypt it, then send it to ``listen_socket`` socket.



	Any other value than ``encrypt`` or ``decrypt``:

		1 - When receives data from ``listen_socket`` socket, send it to ``forward_socket`` socket without any change.

		2 - When receives data from ``forward_socket`` socket, send it to ``listen_socket`` socket without any change.
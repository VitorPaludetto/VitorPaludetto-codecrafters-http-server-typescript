import * as net from 'net';

const server: net.Server = net.createServer((socket: net.Socket) => {
  socket.on('close', () => {
    socket.end();
  });

  socket.on('data', (data) => {
    const firstLine = data.toString().split('\r\n')[0];
    const [_, path] = firstLine.split(' ');
    if (path === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  });
});

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

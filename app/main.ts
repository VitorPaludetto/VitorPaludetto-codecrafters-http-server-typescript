import * as net from 'net';

const server: net.Server = net.createServer((socket: net.Socket) => {
  socket.on('close', () => {
    socket.end();
  });

  socket.on('data', (data) => {
    const { method, path, body } = parseRequest(data);
    socket.write(parsePath(path));
  });
});

const parseRequest = (request: Buffer) => {
  const [head, body] = request.toString().split('\r\n\r\n');
  const [requestLine, headers] = head.split('\r\n');
  const [method, path, httpVersion] = requestLine.split(' ');

  return { method, path, body, headers, httpVersion };
};

const parsePath = (path: string): string => {
  if (path === '/') return 'HTTP/1.1 200 OK\r\n\r\n';
  if (path.startsWith('/echo/')) {
    const matchEchoRegex = /(\/echo\/)(.*)/;
    const echoContent = path.match(matchEchoRegex);

    let content = '';

    if (echoContent !== null) content = echoContent[2];

    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`;
  }
  return 'HTTP/1.1 404 Not Found\r\n\r\n';
};

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

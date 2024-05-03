import * as net from 'net';

enum responseStatus {
  OK = '200 OK',
  NotFound = '404 Not Found',
}

type responseHeaders = {
  contentType: string;
  contentLength: number;
};

const server: net.Server = net.createServer((socket: net.Socket) => {
  socket.on('close', () => {
    socket.end();
  });

  socket.on('data', (data) => {
    const request = parseRequest(data);

    if (request.path === '/') {
      socket.write(
        createResponse(responseStatus.OK, {
          contentType: 'text/plain',
          contentLength: 0,
        })
      );
    } else if (request.path.startsWith('/echo/')) {
      const content = parsePath(request.path, /(\/echo\/)(.*)/);

      socket.write(
        createResponse(
          responseStatus.OK,
          { contentType: 'text/plain', contentLength: content.length },
          content
        )
      );
    } else if (request.path.startsWith('/user-agent')) {
      const content = parseHeaders(
        request.headers,
        'User-Agent',
        /(User-Agent: )(.*)/
      );

      socket.write(
        createResponse(
          responseStatus.OK,
          { contentType: 'text/plain', contentLength: content.length },
          content
        )
      );
    } else {
      socket.write(
        createResponse(responseStatus.NotFound, {
          contentType: 'text/plain',
          contentLength: 0,
        })
      );
    }
  });
});

const parseRequest = (request: Buffer) => {
  const [head, body] = request.toString().split('\r\n\r\n');
  const [requestLine, ...headers] = head.split('\r\n');
  const [method, path, httpVersion] = requestLine.split(' ');

  return { method, path, body, headers, httpVersion };
};

const parsePath = (path: string, regex: RegExp): string => {
  const pathContent = path.match(regex);
  // 2 is the position of the content we want inside the object returned by the match function.
  if (pathContent !== null) return pathContent[2];
  return '';
};

const parseHeaders = (
  headers: string[],
  lookingHeader: string,
  regex: RegExp
): string => {
  let content = '';

  const filteredHeader = headers.filter((header) => {
    if (header.startsWith(lookingHeader)) {
      return header;
    }
  });

  const headerContent = filteredHeader.toString().match(regex);
  // 2 is the position of the content we want inside the object returned by the match function.
  if (headerContent !== null) content = headerContent[2];

  return content;
};

const createResponse = (
  status: responseStatus,
  { contentType, contentLength }: responseHeaders,
  body?: string
): string => {
  let response = '';

  response += `HTTP/1.1 ${status}\r\n`;
  if (contentLength > 0) {
    response += `Content-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n`;
  }
  if (body) {
    response += `${body}`;
  }

  return response;
};

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

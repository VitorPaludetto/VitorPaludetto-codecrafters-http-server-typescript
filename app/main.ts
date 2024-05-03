import fs from 'fs';
import * as net from 'net';

enum responseStatus {
  OK = '200 OK',
  Created = '201 Created',
  NotFound = '404 Not Found',
}

type responseHeaders = {
  contentType: string;
  contentLength: number;
};

let dir: string;

const args = process.argv;
args.forEach((arg, index) => {
  if (arg.includes('directory') && args[index + 1].length > 0) {
    dir = args[index + 1];
  }
});

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
    } else if (request.path.startsWith('/files') && request.method === 'GET') {
      const fileName = parsePath(request.path, /(\/files\/)(.*)/);

      try {
        const fileContent = fs.readFileSync(`${dir}/${fileName}`, 'utf-8');
        socket.write(
          createResponse(
            responseStatus.OK,
            {
              contentType: 'application/octet-stream',
              contentLength: fileContent.length,
            },
            fileContent
          )
        );
      } catch (err) {
        console.error(err);
        socket.write(
          createResponse(responseStatus.NotFound, {
            contentType: 'application/octet-stream',
            contentLength: 0,
          })
        );
      }
    } else if (request.path.startsWith('/files') && request.method === 'POST') {
      const fileName = parsePath(request.path, /(\/files\/)(.*)/);

      try {
        fs.writeFileSync(`${dir}/${fileName}`, request.body);
        socket.write(
          createResponse(responseStatus.Created, {
            contentType: 'application/octet-stream',
            contentLength: 0,
          })
        );
      } catch (err) {
        console.error(err);
        socket.write(
          createResponse(responseStatus.NotFound, {
            contentType: 'application/octet-stream',
            contentLength: 0,
          })
        );
      }
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
  response += `Content-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n`;

  if (body) {
    response += `${body}`;
  }

  return response;
};

server.listen(4221, 'localhost', () => {
  console.log('Server is running on port 4221');
});

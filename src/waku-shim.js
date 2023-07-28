// @ts-nocheck
import { rsc } from "waku";
import { PassThrough, Readable } from "node:stream";

const middleware = rsc({ command: "start" });

/**
 *
 * @param {Request} request
 */
export async function handleWakuRequest(request) {
  const req = createWakuRequest(request);
  const passThrough = new PassThrough();
  const headers = new Headers();
  passThrough.setHeader = (name, value) => {
    headers.set(name, value);
  };
  await middleware(req, passThrough, () => {});

  return new Response(passThrough, {
    status: passThrough?.statusCode,
    headers,
  });
}

/**
 *
 * @param {Request} request
 */
function createWakuRequest(request) {
  const headers = Object.fromEntries(request.headers.entries());

  // Prepare stream from body
  const bodyStream = request.body
    ? Readable.fromWeb(request.body)
    : new Readable();

  return {
    headers: headers,
    url: request.url,
    pipe: bodyStream.pipe.bind(bodyStream),
    [Symbol.asyncIterator]: bodyStream[Symbol.asyncIterator].bind(bodyStream),
  };
}

// @ts-nocheck
import { rsc, devServer } from "waku";
import { PassThrough, Readable } from "node:stream";

/**
 *
 * @param {"start" | "dev"} command
 */
export function createRequestHandler(command) {
  const rscMiddleware = rsc({ command });

  if (command === "dev") {
    const devServerMiddleware = devServer();

    /**
     * @param {Request} request
     */
    return async function handleWakuDevRequest(request) {
      const req = createWakuRequest(request);
      const res = createWakuResponse();
      let p2;
      let p1 = rscMiddleware(req, res, () => {
        p2 = devServerMiddleware(req, res, () => {});
      });

      await Promise.all([p1, p2]);

      return new Response(res, {
        status: res?.statusCode,
        headers: res?.headers,
      });
    };
  }

  /**
   * @param {Request} request
   */
  return async function handleWakuProdRequest(request) {
    const req = createWakuRequest(request);
    const res = createWakuResponse();
    await rscMiddleware(req, res, () => {});

    return new Response(res, {
      status: res?.statusCode,
      headers: res?.headers,
    });
  };
}

/**
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

function createWakuResponse() {
  const headers = new Headers();
  const passThrough = new PassThrough();
  passThrough.setHeader = (name, value) => {
    headers.set(name, value);
  };
  passThrough.headers = headers;

  return passThrough;
}

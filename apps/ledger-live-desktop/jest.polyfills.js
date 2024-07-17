/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
// jest.polyfills.js
/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These HAVE to be require's and HAVE to be in this exact
 * order, since "undici" depends on the "TextEncoder" global API.
 *
 * Consider migrating to a more modern test runner if
 * you don't want to deal with this.
 */

const { TextDecoder, TextEncoder, ReadableStream } = require("util");

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.ReadableStream = ReadableStream;

const { Blob, File } = require("buffer");

const { fetch, Headers, FormData, Request, Response } = require("undici");

global.Blob = Blob;
global.File = File;
global.fetch = fetch;
global.Headers = Headers;
global.FormData = FormData;
global.Request = Request;
global.Response = Response;

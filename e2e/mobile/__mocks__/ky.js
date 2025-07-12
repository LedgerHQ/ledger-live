// Mock for ky to avoid ESM import issues
const mockResponse = {
  json: jest.fn(() => Promise.resolve({})),
  text: jest.fn(() => Promise.resolve("")),
  blob: jest.fn(() => Promise.resolve(new Blob())),
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Map(),
};

const ky = jest.fn(() => Promise.resolve(mockResponse));

// Add HTTP method shortcuts
ky.get = jest.fn(() => Promise.resolve(mockResponse));
ky.post = jest.fn(() => Promise.resolve(mockResponse));
ky.put = jest.fn(() => Promise.resolve(mockResponse));
ky.patch = jest.fn(() => Promise.resolve(mockResponse));
ky.head = jest.fn(() => Promise.resolve(mockResponse));
ky.delete = jest.fn(() => Promise.resolve(mockResponse));

// Add extend method
ky.extend = jest.fn(() => ky);

// Add create method
ky.create = jest.fn(() => ky);

// HTTPError class
ky.HTTPError = class HTTPError extends Error {
  constructor(response) {
    super(`HTTP Error ${response.status}`);
    this.response = response;
  }
};

module.exports = ky;
module.exports.default = ky;

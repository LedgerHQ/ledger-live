import nock from "nock";

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
  // Also drop nock's http/https overrides. Importing nock patches them process-wide, and jest reuses
  // a worker process across test files, so without this a suite that mocks the network another way
  // (MSW) inherits nock's interceptor from an earlier file in the same worker: nock answers first and
  // MSW never sees the request. The next file that imports nock re-activates it on import.
  nock.restore();
});

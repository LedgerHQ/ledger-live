import http from "http";
import nock from "nock";

// The `afterAll` in ./index relies on `nock.restore()` putting the native `http.ClientRequest` back,
// so that a reused jest worker does not carry nock's interceptor into a later suite that mocks the
// network with MSW. Guard the invariant: a nock upgrade that stopped restoring the override would
// silently reintroduce that cross-suite leak.
describe("nock.restore", () => {
  it("puts the original http.ClientRequest back and deactivates nock", () => {
    const patched = http.ClientRequest;

    nock.restore();

    const native = http.ClientRequest;
    expect(nock.isActive()).toBe(false);
    expect(native).not.toBe(patched);

    // Leave nock as the rest of the run expects to find it.
    nock.activate();
    expect(nock.isActive()).toBe(true);
    expect(http.ClientRequest).not.toBe(native);
  });
});

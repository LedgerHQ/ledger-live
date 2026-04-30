import nock from "nock";
import { createApi } from "../api";

const HORIZON = "https://horizon-testnet.stellar.org";
const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

describe("createApi listOperations / operationsFromHeight (no listOperations mock)", () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("rethrows non-429 errors from the operations pagination loop", async () => {
    nock(HORIZON)
      .get(uri => uri.includes(`/accounts/${ADDRESS}/operations`))
      .reply(403, { status: 403, title: "Forbidden" });

    const api = createApi({
      explorer: {
        url: `${HORIZON}/`,
      },
    });

    await expect(api.listOperations(ADDRESS, { minHeight: 0, order: "asc" })).rejects.toThrow();
  });

  it("returns empty page when account has no operations", async () => {
    nock(HORIZON)
      .get(uri => uri.includes(`/accounts/${ADDRESS}/operations`))
      .reply(200, {
        _links: { self: { href: "" }, next: { href: "" }, prev: { href: "" } },
        _embedded: { records: [] },
      });

    const api = createApi({
      explorer: {
        url: `${HORIZON}/`,
      },
    });

    const page = await api.listOperations(ADDRESS, { minHeight: 0, order: "asc" });
    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  describe("rate-limit retry", () => {
    let setTimeoutSpy: jest.SpyInstance;

    beforeEach(() => {
      setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler) => {
        if (typeof fn === "function") {
          (fn as () => void)();
        }
        return 0 as unknown as NodeJS.Timeout;
      });
    });

    afterEach(() => {
      setTimeoutSpy.mockRestore();
    });

    it("retries listOperations after 429 without waiting 4s", async () => {
      const emptyPage = {
        _links: { self: { href: "" }, next: { href: "" }, prev: { href: "" } },
        _embedded: { records: [] },
      };
      nock(HORIZON)
        .get(uri => uri.includes(`/accounts/${ADDRESS}/operations`))
        .reply(429, { status: 429 })
        .get(uri => uri.includes(`/accounts/${ADDRESS}/operations`))
        .reply(200, emptyPage);

      const api = createApi({
        explorer: {
          url: `${HORIZON}/`,
        },
      });

      const page = await api.listOperations(ADDRESS, { minHeight: 0, order: "asc" });
      expect(page.items).toEqual([]);
    });
  });
});

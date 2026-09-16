import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  resolveOperationHistoryBound,
  operationHistoryConfig,
  DEFAULT_MAX_OPERATIONS,
  DEFAULT_PAGE_SIZE_BY_FAMILY,
} from "./operationHistoryBound";

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    getValueByKey: jest.fn(),
  },
}));

const mockGetValueByKey = jest.mocked(LiveConfig.getValueByKey);

describe("resolveOperationHistoryBound", () => {
  beforeEach(() => {
    mockGetValueByKey.mockReset();
  });

  describe("graceful degradation", () => {
    it("falls back to the safety ceiling when LiveConfig throws (config not set) -- a missing config must not reopen the crash", () => {
      mockGetValueByKey.mockImplementation(() => {
        throw new Error("Config not set");
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it.each([[null], ["a string"], [42], [[]]])(
      "falls back to the safety ceiling for a malformed payload %j",
      payload => {
        mockGetValueByKey.mockReturnValue(payload);
        expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
          maxOperations: DEFAULT_MAX_OPERATIONS,
          pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
        });
      },
    );
  });

  describe("hostile per-currency values", () => {
    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "5000"],
      ["null", null],
    ])(
      "falls back to the safety ceiling when the currency entry's maxOperations is %s",
      (_label, value) => {
        mockGetValueByKey.mockReturnValue({ networks: { ethereum: { maxOperations: value } } });
        expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
          maxOperations: DEFAULT_MAX_OPERATIONS,
          pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
        });
      },
    );

    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "5000"],
      ["null", null],
    ])("falls back to the safety ceiling when the global maxOperations is %s", (_label, value) => {
      mockGetValueByKey.mockReturnValue({ maxOperations: value, networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });
  });

  describe("resolution", () => {
    it("falls back to the safety ceiling when neither a global nor a per-currency value is set", () => {
      mockGetValueByKey.mockReturnValue({ networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("resolves the global value when no per-currency entry exists for the currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("a per-currency value overrides the global value", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { ethereum: { maxOperations: 200 } },
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 200,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("does not apply another currency's bound", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { stellar: { maxOperations: 100 } },
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("resolves the safety ceiling when the currency is absent from the networks map and no global value is set", () => {
      mockGetValueByKey.mockReturnValue({ networks: { tron: { maxOperations: 200 } } });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("an unknown key falls back to the global value rather than to the safety ceiling -- this is what makes the key space safe to get wrong", () => {
      // The trap this key space exists to remove: a remote payload keyed by the coin-framework
      // family (e.g. "evm") rather than by currency id (e.g. "ethereum") never matches. If a
      // mismatched key silently resolved to the *safety ceiling* instead of falling back to the
      // global, a deliberately lower bound would look configured and do nothing, with no error and
      // no log.
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { evm: { maxOperations: 200 } }, // wrong key space, deliberately
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });
  });

  describe("pageSize resolution", () => {
    it("sends no page size to a family whose limit support is not established", () => {
      // The contract requires a module to *raise* when sent a `limit` it does not support, so an
      // unlisted family must receive none at all -- passing one would fail its every sync.
      mockGetValueByKey.mockReturnValue({ networks: {} });
      expect(resolveOperationHistoryBound("casper", "casper").pageSize).toBeUndefined();
      expect(resolveOperationHistoryBound("tezos", "tezos").pageSize).toBeUndefined();
    });

    it("sends the shipped page size to a family whose support is established", () => {
      mockGetValueByKey.mockReturnValue({ networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm").pageSize).toBe(
        DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      );
    });

    it("lets a remote value establish a page size for an unlisted family", () => {
      mockGetValueByKey.mockReturnValue({ networks: { casper: { pageSize: 50 } } });
      expect(resolveOperationHistoryBound("casper", "casper").pageSize).toBe(50);
    });

    it("falls back to no page size for an unlisted family when the config is unreadable", () => {
      mockGetValueByKey.mockImplementation(() => {
        throw new Error("Config not set");
      });
      expect(resolveOperationHistoryBound("casper", "casper").pageSize).toBeUndefined();
      expect(resolveOperationHistoryBound("ethereum", "evm").pageSize).toBe(
        DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      );
    });

    it("resolves the global page size when no per-currency entry exists for the currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, pageSize: 150, networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: 150,
      });
    });

    it("a per-currency page size overrides the global page size", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        pageSize: 150,
        networks: { ethereum: { maxOperations: 200, pageSize: 50 } },
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 200,
        pageSize: 50,
      });
    });

    it("falls back to the shipped per-family page size when absent, globally and per currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
    });

    it("an unknown currency key still falls back to the global page size rather than to the constant", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        pageSize: 150,
        networks: { evm: { pageSize: 50 } }, // wrong key space, deliberately
      });
      expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
        maxOperations: 5000,
        pageSize: 150,
      });
    });

    it("clamps a page size above what every routed module can serve, rather than forwarding it", () => {
      // The resolved value is sent verbatim as `listOperations`' `limit`. coin-tron throws above
      // 200, so an unclamped remote value would take that whole family down; a very large one
      // would also undo the per-page memory protection this setting exists to provide.
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, pageSize: 1_000_000, networks: {} });
      expect(resolveOperationHistoryBound("ethereum", "evm").pageSize).toBe(200);

      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { ethereum: { pageSize: 250 } },
      });
      expect(resolveOperationHistoryBound("ethereum", "evm").pageSize).toBe(200);
    });

    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "50"],
      ["null", null],
    ])(
      "falls back to the shipped per-family page size when the currency entry's pageSize is %s",
      (_label, value) => {
        mockGetValueByKey.mockReturnValue({
          maxOperations: 5000,
          networks: { ethereum: { pageSize: value } },
        });
        expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
          maxOperations: 5000,
          pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
        });
      },
    );

    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "50"],
      ["null", null],
    ])(
      "falls back to the shipped per-family page size when the global pageSize is %s",
      (_label, value) => {
        mockGetValueByKey.mockReturnValue({ maxOperations: 5000, pageSize: value, networks: {} });
        expect(resolveOperationHistoryBound("ethereum", "evm")).toEqual({
          maxOperations: 5000,
          pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
        });
      },
    );
  });

  describe("the missing-key path logs once", () => {
    it("logs exactly once across repeated calls", () => {
      // `warnedConfigMissing` is module-level state; this suite's earlier "LiveConfig throws"
      // test has almost certainly already flipped it, and jest.resetModules() isn't used here on
      // purpose -- the same one-shot contract as resolveA4ChainConfig is what's under test, not
      // the exact call count, since the flag flips at most once for the whole module lifetime.
      mockGetValueByKey.mockImplementation(() => {
        throw new Error("Config not set");
      });
      const first = resolveOperationHistoryBound("ethereum", "evm");
      const second = resolveOperationHistoryBound("stellar", "stellar");
      expect(first).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE_BY_FAMILY.evm,
      });
      // stellar is not a family we send a `limit` to, so the fallback carries no page size for it.
      expect(second).toEqual({ maxOperations: DEFAULT_MAX_OPERATIONS, pageSize: undefined });
    });
  });
});

describe("operationHistoryConfig", () => {
  it("registers config_generic_operation_history as an object type, defaulting to the safety ceiling", () => {
    expect(operationHistoryConfig.config_generic_operation_history).toEqual({
      type: "object",
      default: { maxOperations: DEFAULT_MAX_OPERATIONS, pageSize: undefined, networks: {} },
    });
  });
});

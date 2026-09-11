import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  resolveOperationHistoryBound,
  operationHistoryConfig,
  DEFAULT_MAX_OPERATIONS,
  DEFAULT_PAGE_SIZE,
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
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it.each([[null], ["a string"], [42], [[]]])(
      "falls back to the safety ceiling for a malformed payload %j",
      payload => {
        mockGetValueByKey.mockReturnValue(payload);
        expect(resolveOperationHistoryBound("ethereum")).toEqual({
          maxOperations: DEFAULT_MAX_OPERATIONS,
          pageSize: DEFAULT_PAGE_SIZE,
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
        expect(resolveOperationHistoryBound("ethereum")).toEqual({
          maxOperations: DEFAULT_MAX_OPERATIONS,
          pageSize: DEFAULT_PAGE_SIZE,
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
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });
  });

  describe("resolution", () => {
    it("falls back to the safety ceiling when neither a global nor a per-currency value is set", () => {
      mockGetValueByKey.mockReturnValue({ networks: {} });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it("resolves the global value when no per-currency entry exists for the currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, networks: {} });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it("a per-currency value overrides the global value", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { ethereum: { maxOperations: 200 } },
      });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 200,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it("does not apply another currency's bound", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        networks: { stellar: { maxOperations: 100 } },
      });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it("resolves the safety ceiling when the currency is absent from the networks map and no global value is set", () => {
      mockGetValueByKey.mockReturnValue({ networks: { tron: { maxOperations: 200 } } });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE,
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
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });
  });

  describe("pageSize resolution", () => {
    it("resolves the global page size when no per-currency entry exists for the currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, pageSize: 250, networks: {} });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: 250,
      });
    });

    it("a per-currency page size overrides the global page size", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        pageSize: 250,
        networks: { ethereum: { maxOperations: 200, pageSize: 50 } },
      });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 200,
        pageSize: 50,
      });
    });

    it("falls back to the DEFAULT_PAGE_SIZE constant when absent, globally and per currency", () => {
      mockGetValueByKey.mockReturnValue({ maxOperations: 5000, networks: {} });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it("an unknown currency key still falls back to the global page size rather than to the constant", () => {
      mockGetValueByKey.mockReturnValue({
        maxOperations: 5000,
        pageSize: 250,
        networks: { evm: { pageSize: 50 } }, // wrong key space, deliberately
      });
      expect(resolveOperationHistoryBound("ethereum")).toEqual({
        maxOperations: 5000,
        pageSize: 250,
      });
    });

    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "50"],
      ["null", null],
    ])(
      "falls back to the DEFAULT_PAGE_SIZE constant when the currency entry's pageSize is %s",
      (_label, value) => {
        mockGetValueByKey.mockReturnValue({
          maxOperations: 5000,
          networks: { ethereum: { pageSize: value } },
        });
        expect(resolveOperationHistoryBound("ethereum")).toEqual({
          maxOperations: 5000,
          pageSize: DEFAULT_PAGE_SIZE,
        });
      },
    );

    it.each([
      ["negative", -5],
      ["zero", 0],
      ["a string", "50"],
      ["null", null],
    ])(
      "falls back to the DEFAULT_PAGE_SIZE constant when the global pageSize is %s",
      (_label, value) => {
        mockGetValueByKey.mockReturnValue({ maxOperations: 5000, pageSize: value, networks: {} });
        expect(resolveOperationHistoryBound("ethereum")).toEqual({
          maxOperations: 5000,
          pageSize: DEFAULT_PAGE_SIZE,
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
      const first = resolveOperationHistoryBound("ethereum");
      const second = resolveOperationHistoryBound("stellar");
      expect(first).toEqual({ maxOperations: DEFAULT_MAX_OPERATIONS, pageSize: DEFAULT_PAGE_SIZE });
      expect(second).toEqual({
        maxOperations: DEFAULT_MAX_OPERATIONS,
        pageSize: DEFAULT_PAGE_SIZE,
      });
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

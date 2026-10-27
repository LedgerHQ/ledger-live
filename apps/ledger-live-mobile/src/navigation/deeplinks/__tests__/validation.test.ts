import { DdRum } from "@datadog/mobile-react-native";
import {
  validateEarnMenuModal,
  validateLargeMoverLedgerIds,
  validateMarketAssetPath,
  validateMarketListCategory,
} from "../validation";

jest.mock("@datadog/mobile-react-native", () => ({
  DdRum: { addError: jest.fn() },
  ErrorSource: { SOURCE: "SOURCE" },
}));

jest.mock("../../../datadog", () => ({ isDatadogEnabled: true }));

describe("validateLargeMoverLedgerIds", () => {
  it("should return null when ledgerIds is null", () => {
    expect(validateLargeMoverLedgerIds(null)).toBeNull();
  });

  it("should return null when ledgerIds is empty string", () => {
    expect(validateLargeMoverLedgerIds("")).toBeNull();
  });

  it("should return null when ledgerIds is only whitespace", () => {
    expect(validateLargeMoverLedgerIds("   ")).toBeNull();
  });

  it("should lowercase and trim single ledger id", () => {
    expect(validateLargeMoverLedgerIds("ethereum/erc20/usd__coin")).toBe(
      "ethereum/erc20/usd__coin",
    );
    expect(validateLargeMoverLedgerIds("  bitcoin  ")).toBe("bitcoin");
  });

  it("should lowercase and trim multiple ledger ids", () => {
    expect(validateLargeMoverLedgerIds("ethereum/erc20/usd__coin,bitcoin")).toBe(
      "ethereum/erc20/usd__coin,bitcoin",
    );
  });

  it("should remove duplicates", () => {
    expect(validateLargeMoverLedgerIds("bitcoin,ethereum/erc20/usd__coin,bitcoin")).toBe(
      "bitcoin,ethereum/erc20/usd__coin",
    );
  });

  it("should filter out empty segments", () => {
    expect(validateLargeMoverLedgerIds("btc,,eth")).toBe("btc,eth");
  });
});

// Exhaustive parsing/validation behavior lives in @ledgerhq/asset-detail's parseLedgerAssetPath
// tests; here we only assert this validator delegates to it for the coin, token and invalid cases.
describe("validateMarketAssetPath", () => {
  it("should return a canonical currency id for a coin path", () => {
    expect(validateMarketAssetPath("/BiTcOiN")).toEqual({
      currencyId: "bitcoin",
      assetId: "bitcoin",
    });
  });

  it("should return the full Ledger token id for a token path", () => {
    expect(validateMarketAssetPath("/ethereum/erc20/usd_tether__erc20_")).toEqual({
      currencyId: "ethereum",
      assetId: "ethereum/erc20/usd_tether__erc20_",
      ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
    });
  });

  it("should return null for unresolved or empty paths", () => {
    expect(validateMarketAssetPath("/unknown/erc20/usd_tether__erc20_")).toBeNull();
    expect(validateMarketAssetPath(null)).toBeNull();
    expect(validateMarketAssetPath("")).toBeNull();
  });
});

describe("validateMarketListCategory", () => {
  it("should return undefined when category is null", () => {
    expect(validateMarketListCategory(null)).toBeUndefined();
  });

  it("should return undefined when category is empty", () => {
    expect(validateMarketListCategory("")).toBeUndefined();
  });

  it("should return undefined for an unknown category", () => {
    expect(validateMarketListCategory("stable")).toBeUndefined();
  });

  it("should normalize and return a valid category", () => {
    expect(validateMarketListCategory(" Stocks ")).toBe("stocks");
    expect(validateMarketListCategory("STARRED")).toBe("starred");
    expect(validateMarketListCategory("all")).toBe("all");
  });
});

function sentContexts(): string {
  return JSON.stringify(jest.mocked(DdRum.addError).mock.calls.map(call => call[3]));
}

describe("deeplink security events", () => {
  const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends the length of malformed JSON, not its text", () => {
    const malformed = `{"address":"${address}"`;
    expect(validateEarnMenuModal("Title", malformed)).toBeNull();

    expect(DdRum.addError).toHaveBeenCalledWith(
      "Deeplink security event: invalid_json",
      "SOURCE",
      "",
      expect.objectContaining({
        deeplink_security: expect.objectContaining({
          reason: "parse_error",
          json_length: malformed.length,
          error_name: "SyntaxError",
        }),
      }),
    );
    expect(sentContexts()).not.toContain(address);
  });

  it("sends the length of JSON that fails validation, not its text", () => {
    expect(validateEarnMenuModal("Title", JSON.stringify({ address }))).toBeNull();

    expect(DdRum.addError).toHaveBeenCalledWith(
      "Deeplink security event: invalid_json",
      "SOURCE",
      "",
      expect.objectContaining({
        deeplink_security: expect.objectContaining({ reason: "validation_failed" }),
      }),
    );
    expect(sentContexts()).not.toContain(address);
  });

  it("sends only the host of a rejected link", () => {
    const options = JSON.stringify([
      {
        label: "Claim",
        metadata: {
          button: "claim",
          live_app: "earn",
          flow: "stake",
          link: `https://evil.example/claim?address=${address}`,
        },
      },
    ]);

    expect(validateEarnMenuModal("Title", options)).toBeNull();

    expect(DdRum.addError).toHaveBeenCalledWith(
      "Deeplink security event: validation_failed",
      "SOURCE",
      "",
      expect.objectContaining({
        deeplink_security: expect.objectContaining({
          reason: "invalid_metadata_link",
          link_host: "evil.example",
        }),
      }),
    );
    expect(sentContexts()).not.toContain(address);
  });
});

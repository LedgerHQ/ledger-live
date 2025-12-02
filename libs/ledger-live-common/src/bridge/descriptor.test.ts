import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { getDescriptor, getSendDescriptor, sendFeatures } from "./descriptor";
import * as configModule from "../config/index";

jest.mock("../config/index");

describe("getDescriptor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null for undefined currency", () => {
    const descriptor = getDescriptor(undefined);
    expect(descriptor).toBeNull();
  });

  it.each([
    [
      "bitcoin",
      {
        send: {
          inputs: {},
          fees: {
            hasPresets: true,
            hasCustom: true,
            hasCoinControl: true,
          },
        },
      },
    ],
    [
      "ethereum",
      {
        send: {
          inputs: {
            recipientSupportsDomain: true,
          },
          fees: {
            hasPresets: true,
            hasCustom: true,
          },
        },
      },
    ],
    [
      "solana",
      {
        send: {
          inputs: {
            memo: {
              type: "text",
              maxLength: 32,
            },
          },
          fees: {
            hasPresets: true,
            hasCustom: false,
          },
        },
      },
    ],
  ])("should return descriptor for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const descriptor = getDescriptor(currency);
    expect(descriptor).toEqual(expected);
  });

  it.each([
    [
      "feature is inactive",
      {
        status: {
          type: "active",
          features: [{ id: "blockchain_txs", status: "inactive" }],
        },
      } as CurrencyConfig,
    ],
    [
      "currency status is not active",
      {
        status: {
          type: "under_maintenance",
          message: "Maintenance",
        },
      } as CurrencyConfig,
    ],
  ])("should return default descriptor when %s", (_, mockConfig) => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue(mockConfig);

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).toBeNull();
  });

  it("should return full descriptor when no features array (assume all active)", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
      },
    });

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).toEqual({
      send: {
        fees: {
          hasPresets: true,
          hasCustom: true,
          hasCoinControl: true,
        },
      },
    });
  });

  it("should return default descriptor when config throws error", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockImplementation(() => {
      throw new Error("Config not found");
    });

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).toBeNull();
  });
});

describe("getSendDescriptor", () => {
  it("should return send descriptor", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const sendDescriptor = getSendDescriptor(bitcoin);
    expect(sendDescriptor).toEqual({
      inputs: {},
      fees: {
        hasPresets: true,
        hasCustom: true,
      },
    });
  });

  it("should return null when feature is not active", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "inactive" }],
      },
    });

    const sendDescriptor = getSendDescriptor(bitcoin);
    expect(sendDescriptor).toBeNull();
  });
});

describe("sendFeatures", () => {
  beforeEach(() => {
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });
  });

  it.each([
    ["solana", true],
    ["bitcoin", false],
  ])("should check memo support for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.hasMemo(currency)).toBe(expected);
  });

  it("should check fee presets support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasFeePresets(bitcoin)).toBe(true);
  });

  it("should check custom fees support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasCustomFees(bitcoin)).toBe(true);
  });

  it("should check coin control support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasCoinControl(bitcoin)).toBe(true);
  });

  it("should get memo type", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getMemoType(solana)).toBe("text");
  });

  it("should get memo max length", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getMemoMaxLength(solana)).toBe(32);
  });

  it.each([
    ["ethereum", true],
    ["bitcoin", false],
  ])("should check domain support for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.supportsDomain(currency)).toBe(expected);
  });
});

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { isZcashShieldedEnabled, setZcashShieldedEnabled } from "../../zcashRouting";
import { sendFeatures } from "./features";

const celo = getCryptoCurrencyById("celo");
const stellar = getCryptoCurrencyById("stellar");
const ethereum = getCryptoCurrencyById("ethereum");
const zcash = getCryptoCurrencyById("zcash");

describe("sendFeatures.hasDefaultStrategy / getDefaultStrategyPatch", () => {
  it("Celo: declares a default strategy that clears feesStrategy + fees only", () => {
    expect(sendFeatures.hasDefaultStrategy(celo)).toBe(true);

    const patch = sendFeatures.getDefaultStrategyPatch(celo);
    expect(patch).toEqual({ feesStrategy: undefined, fees: undefined });
    expect(patch).not.toHaveProperty("feeCurrency");
    expect(patch).not.toHaveProperty("feeCurrencyUnwrapped");
    expect(patch).not.toHaveProperty("feeCurrencyAccountId");
  });

  it("Stellar: declares a default strategy that clears feesStrategy + fees + customFees", () => {
    expect(sendFeatures.hasDefaultStrategy(stellar)).toBe(true);

    const patch = sendFeatures.getDefaultStrategyPatch(stellar);
    expect(patch).toEqual({
      feesStrategy: undefined,
      fees: undefined,
      customFees: undefined,
    });
  });

  it("EVM: has no default strategy (preset-based fees)", () => {
    expect(sendFeatures.hasDefaultStrategy(ethereum)).toBe(false);
    expect(sendFeatures.getDefaultStrategyPatch(ethereum)).toBeNull();
  });

  it("returns false/null for an undefined currency", () => {
    expect(sendFeatures.hasDefaultStrategy(undefined)).toBe(false);
    expect(sendFeatures.getDefaultStrategyPatch(undefined)).toBeNull();
  });
});

describe("sendFeatures.getTrackingAttributes", () => {
  // `resolveFamily` (bridge/zcashRouting) only resolves Zcash to its own descriptor when
  // this flag is on; otherwise it falls back to the Bitcoin chain-adapter's descriptor.
  const previousShieldedEnabled = isZcashShieldedEnabled();

  beforeEach(() => {
    setZcashShieldedEnabled(true);
  });

  afterEach(() => {
    // Module-level global state shared across every suite in this jest worker.
    setZcashShieldedEnabled(previousShieldedEnabled);
  });

  it("Zcash: forwards the descriptor's privacy/transferFlow attributes once the recipient is classified", () => {
    const transaction = {
      family: "zcash",
      sender: "private",
      recipientType: "public",
      transferType: "shielded-to-transparent",
    };

    expect(sendFeatures.getTrackingAttributes(zcash, transaction)).toEqual({
      privacy: "private",
      transferFlow: "private-to-public",
    });
  });

  it("Zcash: forwards only privacy between the source pool pick and the recipient", () => {
    const transaction = { family: "zcash", sender: "private", transferType: "shielded" };

    expect(sendFeatures.getTrackingAttributes(zcash, transaction)).toEqual({
      privacy: "private",
    });
  });

  it("Zcash: returns {} before a source pool is picked", () => {
    const transaction = { family: "zcash", transferType: "transparent" };

    expect(sendFeatures.getTrackingAttributes(zcash, transaction)).toEqual({});
  });

  it("EVM: returns {} (no tracking-attributes hook declared)", () => {
    expect(sendFeatures.getTrackingAttributes(ethereum, {})).toEqual({});
  });

  it("returns {} for an undefined currency", () => {
    expect(sendFeatures.getTrackingAttributes(undefined, {})).toEqual({});
  });
});

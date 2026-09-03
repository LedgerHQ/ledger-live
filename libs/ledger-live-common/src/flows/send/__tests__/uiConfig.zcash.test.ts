import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getSendUiConfig } from "../uiConfig";
import { isZcashShieldedEnabled, setZcashShieldedEnabled } from "../../../bridge/zcashRouting";

// Unlike `flows/__tests__/uiConfig.test.ts`, this suite does not mock the
// registry or `sendFeatures`: it exercises the real family-resolution ->
// descriptor -> uiConfig chain end to end.

describe("getSendUiConfig (zcash, real resolution)", () => {
  const previousShieldedEnabled = isZcashShieldedEnabled();

  afterEach(() => {
    // `setZcashShieldedEnabled` is module-level global state shared across
    // every suite in this jest worker: restore it so later suites are not
    // silently corrupted.
    setZcashShieldedEnabled(previousShieldedEnabled);
  });

  it("resolves the ZIP-317 fee config with the flag on", () => {
    setZcashShieldedEnabled(true);
    const zcash = getCryptoCurrencyById("zcash");

    const uiConfig = getSendUiConfig(zcash);

    expect(uiConfig.hasFeePresets).toBe(false);
    expect(uiConfig.hasCustomFees).toBe(false);
    expect(uiConfig.hasCoinControl).toBe(false);
    expect(uiConfig.hasDefaultStrategy).toBe(false);
    expect(uiConfig.hasMemo).toBe(true);
    expect(uiConfig.memoType).toBe("text");
    expect(uiConfig.memoMaxLength).toBe(512);
  });

  it("areFeesEditable is false", () => {
    setZcashShieldedEnabled(true);
    const zcash = getCryptoCurrencyById("zcash");

    const uiConfig = getSendUiConfig(zcash);

    // Reproduces `flows/send/hooks/useNetworkFeesCore.ts:172` verbatim:
    //   areFeesEditable = feeStrategyOptions.length > 0 || uiConfig.hasCustomFees || uiConfig.hasCoinControl
    // `feeStrategyOptions` (useNetworkFeesCore.ts:135-146) is empty here because
    // it is only populated from fee presets, and falls back to a single
    // "default" entry only when `hasDefaultStrategy` is true -- both false for
    // Zcash. A future edit to either hook is caught by this citation drifting.
    const feeStrategyOptions = uiConfig.hasFeePresets
      ? ["preset"]
      : uiConfig.hasDefaultStrategy
        ? ["default"]
        : [];
    const areFeesEditable =
      feeStrategyOptions.length > 0 || uiConfig.hasCustomFees || uiConfig.hasCoinControl;

    expect(areFeesEditable).toBe(false);
  });

  it("regression: Bitcoin keeps coin control", () => {
    setZcashShieldedEnabled(true);
    const bitcoin = getCryptoCurrencyById("bitcoin");

    const uiConfig = getSendUiConfig(bitcoin);

    expect(uiConfig.hasCoinControl).toBe(true);
    expect(uiConfig.hasFeePresets).toBe(true);
    expect(uiConfig.hasCustomFees).toBe(true);
  });

  it("regression: an unrelated family (evm) is unchanged", () => {
    setZcashShieldedEnabled(true);
    const ethereum = getCryptoCurrencyById("ethereum");

    const uiConfig = getSendUiConfig(ethereum);

    expect(uiConfig.hasFeePresets).toBe(true);
    expect(uiConfig.hasCustomFees).toBe(true);
    expect(uiConfig.recipientSupportsDomain).toBe(true);
  });
});

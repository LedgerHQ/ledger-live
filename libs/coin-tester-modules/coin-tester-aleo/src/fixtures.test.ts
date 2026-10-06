import {
  GENESIS_ACCOUNT,
  RECORD_A_MICROCREDITS,
  RECORD_B_MICROCREDITS,
  TRANSFER_AMOUNT_MICROCREDITS,
  buildAleoCoinConfig,
  makePrivateAleoAccount,
} from "./fixtures";

describe("buildAleoCoinConfig", () => {
  it("runs with sponsored fees and tokens disabled, like production", () => {
    const config = buildAleoCoinConfig();

    expect(config.isFeeSponsored).toBe(true);
    expect(config.enableTokens).toBe(false);
  });

  it("deviates from production only on the encrypted prove path", () => {
    expect(buildAleoCoinConfig().useEncryptedProve).toBe(false);
  });

  it("defaults recordPickingStrategy to auto and overrides it on request", () => {
    expect(buildAleoCoinConfig().recordPickingStrategy).toBe("auto");
    expect(buildAleoCoinConfig({ recordPickingStrategy: "manual" }).recordPickingStrategy).toBe(
      "manual",
    );
  });
});

describe("makePrivateAleoAccount", () => {
  it("seeds lastPrivateSyncDate so the account is eligible for a combined sync", () => {
    const account = makePrivateAleoAccount(GENESIS_ACCOUNT.address, GENESIS_ACCOUNT.viewKey);

    expect(account.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
    expect(account.aleoResources!.lastPrivateSyncDate!.getTime()).toBeLessThan(Date.now());
    expect(account.aleoResources?.provableApi).toBeNull();
    expect(account.aleoResources?.privateBalance).toBeNull();
    expect(account.aleoResources?.unspentPrivateRecords).toBeNull();
  });
});

describe("record amounts", () => {
  it("sizes RECORD_A and RECORD_B so auto-picking selects A alone", () => {
    expect(RECORD_B_MICROCREDITS).toBeLessThan(TRANSFER_AMOUNT_MICROCREDITS);
    expect(TRANSFER_AMOUNT_MICROCREDITS).toBeLessThan(RECORD_A_MICROCREDITS);
  });
});

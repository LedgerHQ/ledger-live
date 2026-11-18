import { toSetupInfoCard } from "./toSetupInfoCard";

describe("toSetupInfoCard", () => {
  it.each([
    ["deviceSetup.setupChoice", "setupChoice"],
    ["deviceSetup.newSeed", "recoveryPhrase"],
    ["deviceSetup.backupRecoveryKey", "recoveryKey"],
    ["deviceSetup.restoreChoice", "restoreChoice"],
    ["deviceSetup.restoreWords", "recoveryPhrase"],
    ["deviceSetup.restoreRecoveryKey", "restoreRecoveryKey"],
  ] as const)("should show the %s card", (machineState, card) => {
    expect(toSetupInfoCard(machineState, true)).toBe(card);
  });

  it.each([
    "checks.firmwareCheck",
    "deviceSetup.naming",
    "deviceSetup.pin",
    "deviceSetup.restoreRecover",
  ])("should show no card on %s", machineState => {
    expect(toSetupInfoCard(machineState, true)).toBeUndefined();
  });

  it.each(["deviceSetup.backupRecoveryKey", "deviceSetup.restoreRecoveryKey"])(
    "should hide the Recovery Key card on %s when the device reports no Recovery Key",
    machineState => {
      expect(toSetupInfoCard(machineState, false)).toBeUndefined();
    },
  );

  it("should keep the other cards when the device reports no Recovery Key", () => {
    expect(toSetupInfoCard("deviceSetup.newSeed", false)).toBe("recoveryPhrase");
  });
});

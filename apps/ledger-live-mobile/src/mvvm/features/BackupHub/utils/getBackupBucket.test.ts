import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { getBackupBucket } from "./getBackupBucket";

describe("getBackupBucket", () => {
  it("maps BACKUP_DONE to done", () => {
    expect(getBackupBucket(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)).toBe("done");
  });

  it("maps NO_SUBSCRIPTION to not-subscribed", () => {
    expect(getBackupBucket(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)).toBe(
      "not-subscribed",
    );
  });

  it.each([
    LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
    LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY,
    LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
  ])("maps the in-progress state %s to in-progress", state => {
    expect(getBackupBucket(state)).toBe("in-progress");
  });

  it("defaults unknown states to in-progress", () => {
    expect(getBackupBucket("SOME_FUTURE_STATE" as LedgerRecoverSubscriptionStateEnum)).toBe(
      "in-progress",
    );
  });
});

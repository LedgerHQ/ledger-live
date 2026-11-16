// oxlint-disable typescript/consistent-type-assertions
import {
  RestoreBackupStatus as DmkRestoreStatus,
  type RestoreBackupDAOutput as DmkRestoreResult,
} from "@ledgerhq/dmk-ledger-wallet";
import { RestoreStatus } from "@domain/entity-device-os-update";
import { mockRestoreResult } from "@domain/entity-device-os-update/schema.mock";
import { toDomainRestoreResult } from "./toDomainRestoreResult";

describe("toDomainRestoreResult", () => {
  it("keeps only the fields the entity declares", () => {
    const result = mockRestoreResult({
      restoreStatus: RestoreStatus.partial,
      restoredApps: [{ appName: "Bitcoin", restoredApp: true, restoredAppStorage: false }],
    });
    const dmkResult = {
      ...result,
      restoreStatus: DmkRestoreStatus.PARTIAL,
      restoredApps: result.restoredApps?.map(app => ({ ...app, unknownField: 1 })),
      unknownField: "result",
    } as DmkRestoreResult;

    expect(toDomainRestoreResult(dmkResult)).toStrictEqual(result);
  });

  it.each([
    [DmkRestoreStatus.FULL, RestoreStatus.full],
    [DmkRestoreStatus.PARTIAL, RestoreStatus.partial],
    [DmkRestoreStatus.OUT_OF_MEMORY, RestoreStatus.outOfMemory],
  ])("maps the %s status", (dmkStatus, status) => {
    const dmkResult = { ...mockRestoreResult(), restoreStatus: dmkStatus } as DmkRestoreResult;

    expect(toDomainRestoreResult(dmkResult).restoreStatus).toBe(status);
  });

  it("keeps no restored apps when the DMK reports none", () => {
    const dmkResult = {
      ...mockRestoreResult(),
      restoreStatus: DmkRestoreStatus.FULL,
      restoredApps: undefined,
    } as DmkRestoreResult;

    expect(toDomainRestoreResult(dmkResult).restoredApps).toBeUndefined();
  });
});

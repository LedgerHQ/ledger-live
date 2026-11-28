import type {
  Backup as DmkBackup,
  OsUpdate as DmkOsUpdate,
  RestoreAppResult as DmkRestoredApp,
  RestoreBackupDAOutput as DmkRestoreResult,
  RestoreBackupStatus as DmkRestoreStatus,
} from "@ledgerhq/dmk-ledger-wallet";
import type {
  DeviceBackup,
  OsUpdate,
  RestoredApp,
  RestoreResult,
  RestoreStatus,
} from "@domain/entity-device-os-update";

// The entity re-declares the DMK shapes so that domain/ never imports the DMK. These checks fail to
// compile as soon as a DMK release changes one of them: added, removed or retyped field.
// `Normalize` rebuilds both sides the same way, so only their content is compared, not how they are
// written (a Zod-inferred object and a declared type are otherwise never strictly equal).
type Normalize<T> = T extends Date
  ? T
  : T extends readonly (infer Item)[]
    ? Normalize<Item>[]
    : T extends object
      ? { [Key in keyof T]: Normalize<T[Key]> }
      : T;
type Equal<A, B> =
  (<T>() => T extends Normalize<A> ? 1 : 2) extends <T>() => T extends Normalize<B> ? 1 : 2
    ? true
    : false;

const osUpdateMatchesDmk: Equal<OsUpdate, DmkOsUpdate> = true;
const backupMatchesDmk: Equal<DeviceBackup, DmkBackup> = true;
const restoredAppMatchesDmk: Equal<RestoredApp, DmkRestoredApp> = true;
// The DMK status is a TypeScript enum: its values, not its type, have to match the entity's.
const restoreStatusMatchesDmk: Equal<RestoreStatus, `${DmkRestoreStatus}`> = true;
const restoreResultMatchesDmk: Equal<
  Omit<RestoreResult, "restoreStatus">,
  Omit<DmkRestoreResult, "restoreStatus">
> = true;

describe("domain types", () => {
  it("match the DMK OS update, backup and restore result", () => {
    expect([
      osUpdateMatchesDmk,
      backupMatchesDmk,
      restoredAppMatchesDmk,
      restoreStatusMatchesDmk,
      restoreResultMatchesDmk,
    ]).toEqual([true, true, true, true, true]);
  });
});

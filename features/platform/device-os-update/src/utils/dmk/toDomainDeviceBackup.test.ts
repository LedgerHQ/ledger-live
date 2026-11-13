// oxlint-disable typescript/consistent-type-assertions
import type { Backup as DmkBackup } from "@ledgerhq/dmk-ledger-wallet";
import { mockDeviceBackup } from "@domain/entity-device-os-update/schema.mock";
import { toDomainDeviceBackup } from "./toDomainDeviceBackup";

describe("toDomainDeviceBackup", () => {
  it("keeps only the fields the entity declares", () => {
    const backup = mockDeviceBackup();
    const dmkBackup = {
      ...backup,
      installedApps: backup.installedApps.map(app => ({ ...app, unknownField: true })),
      unknownField: "backup",
    } as DmkBackup;

    expect(toDomainDeviceBackup(dmkBackup)).toStrictEqual(backup);
  });
});

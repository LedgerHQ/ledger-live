// oxlint-disable typescript/consistent-type-assertions
import type { OsUpdate as DmkOsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { mockOsUpdate } from "@domain/entity-device-os-update/schema.mock";
import { toDomainOsUpdate } from "./toDomainOsUpdate";

describe("toDomainOsUpdate", () => {
  it("keeps only the fields the entity declares", () => {
    const osUpdate = mockOsUpdate();
    const dmkOsUpdate = {
      ...osUpdate,
      osuFirmware: { ...osUpdate.osuFirmware, unknownField: "osu" },
      finalFirmware: { ...osUpdate.finalFirmware, unknownField: "final" },
      unknownField: "update",
    } as DmkOsUpdate;

    expect(toDomainOsUpdate(dmkOsUpdate)).toStrictEqual(osUpdate);
  });
});

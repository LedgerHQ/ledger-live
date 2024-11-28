import { DeviceModelId } from "@ledgerhq/devices";
import { getCertificate } from "./certificate";

describe("getCertificate", () => {
  it.each([
    {
      device: DeviceModelId.nanoS,
      descriptor:
        "0101010201023501013601021004020100001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b",
      signature:
        "3044022071147da8f0976ce277756e2fa1f905358604e31369f6014af086eded8e5d5e7a0220699be13c56eece4579aa96451be8aebb10e163de1dc467905a579e3b89b801bf",
    },
    {
      device: DeviceModelId.nanoSP,
      descriptor:
        "0101010201023501033601021004010300001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b",
      signature:
        "304402206d4e8d2b892716ae6f3c091d0913c440233fba5c5a5d4600d1defca6b945901d02202ebfee2ad17b982b498a92489fe67ea9c792ee9d6073983401e994bce487d47b",
    },
    {
      device: DeviceModelId.nanoX,
      descriptor:
        "0101010201023501023601021004020400001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b",
      signature:
        "3044022018fefc439335d5d344147c3c7292b32b279f91683706bae07fab0c36b48da91802203fa13bfb405451ad8f9de8b50c8b1cb3907348754ec10ea1ed61d73ae161e81d",
    },
    {
      device: DeviceModelId.stax,
      descriptor:
        "0101010201023501043601021004010500001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b",
      signature:
        "30440220774aa1a064c9bd5ff2c820156b4af106d464d8ca0eb2de5f2956c8b52356496202205ef40dd54beb3c1534d011af9f581f426141d39338b3da6abf4023254cbef72c",
    },
    // Not yet in the CAL
    // {
    //   device: DeviceModelId.europa,
    //   descriptor: "",
    //   signature: "",
    // },
  ])(
    "returns all data in expected format for $device",
    async ({ device, descriptor, signature }) => {
      // When
      const result = await getCertificate(device, "1.3.0", "test");

      // Then
      expect(result).toEqual({
        descriptor,
        signature,
      });
    },
  );
});

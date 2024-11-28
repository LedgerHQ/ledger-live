import { DeviceModelId } from "@ledgerhq/devices";
import { getCertificate } from "./certificate";

describe("getCertificate", () => {
  it("returns all data in expected format", async () => {
    // Given
    const device = DeviceModelId.nanoSP;

    // When
    const result = await getCertificate(device, "1.3.0", "test");

    // Then
    expect(result).toEqual({
      descriptor:
        "0101010201023501033601021004010300001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b",
      signature:
        "304402206d4e8d2b892716ae6f3c091d0913c440233fba5c5a5d4600d1defca6b945901d02202ebfee2ad17b982b498a92489fe67ea9c792ee9d6073983401e994bce487d47b",
    });
  });
});

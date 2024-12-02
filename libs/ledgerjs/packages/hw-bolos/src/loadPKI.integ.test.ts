import Transport from "@ledgerhq/hw-transport";
import TransportNodeHidSingleton from "@ledgerhq/hw-transport-node-hid-singleton";
import loadPKI from "./loadPKI";
import { PKIFailedVerificationError } from "./PKIError";

describe("loadPKI with real connected device", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await TransportNodeHidSingleton.open("");
  });
  afterAll(async () => {
    await transport.close();
  });

  it.skip("returns an Ok", async () => {
    // Given
    const descriptor =
      "0101010201023501043601021004010500001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b";
    const signature =
      "30440220774aa1a064c9bd5ff2c820156b4af106d464d8ca0eb2de5f2956c8b52356496202205ef40dd54beb3c1534d011af9f581f426141d39338b3da6abf4023254cbef72c";

    // When & Then
    await expect(loadPKI(transport, "TRUSTED_NAME", descriptor, signature)).rejects.not.toThrow();
    await (() => new Promise(f => setTimeout(f, 1000)))();
  });

  it("returns an Verification Failed error", async () => {
    // Given
    const descriptor =
      "0101010201023501043601021004010500001302000314010120086e66745f6d657461300200053101043201213401013321035e6c1020c14dc46442fe89f97c0b68cdb15976dc24f24c316e7b30fe4e8cc76b";
    const signature =
      "30440220774aa1a064c9bd5ff2c820156b4af106d464d8ca0eb2de5f2956c8b52356496202205ef40dd54beb3c1534d011af9f581f426141d39338b3da6abf4023254cbef72c";

    // When & Then
    await expect(loadPKI(transport, "TRUSTED_NAME", descriptor, signature)).rejects.toThrow(
      PKIFailedVerificationError,
    );
  });
});

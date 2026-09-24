import Transport from "@ledgerhq/hw-transport";
import { DmkSignerCosmos, LegacySignerCosmos } from "@ledgerhq/live-signer-cosmos";
import { createSigner, setCosmosLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-cosmos", () => ({
  DmkSignerCosmos: jest.fn(),
  LegacySignerCosmos: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmkTransport = { dmk: { id: "dmk" }, sessionId: "session-1" } as unknown as Transport;

describe("createSigner (Cosmos device)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCosmosLdmkEnabled(false);
  });

  afterAll(() => setCosmosLdmkEnabled(false));

  it("uses the legacy signer on a legacy transport, flag off", () => {
    createSigner(legacyTransport);

    expect(LegacySignerCosmos).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerCosmos).not.toHaveBeenCalled();
  });

  it("uses the legacy signer on a legacy transport, flag on", () => {
    setCosmosLdmkEnabled(true);

    createSigner(legacyTransport);

    expect(LegacySignerCosmos).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerCosmos).not.toHaveBeenCalled();
  });

  it("keeps a DMK transport on the legacy signer while the flag is off", () => {
    createSigner(dmkTransport);

    expect(LegacySignerCosmos).toHaveBeenCalledWith(dmkTransport);
    expect(DmkSignerCosmos).not.toHaveBeenCalled();
  });

  it("uses the DMK signer on a DMK transport once the flag is on", () => {
    setCosmosLdmkEnabled(true);

    createSigner(dmkTransport);

    expect(DmkSignerCosmos).toHaveBeenCalledWith({ id: "dmk" }, "session-1");
    expect(LegacySignerCosmos).not.toHaveBeenCalled();
  });
});

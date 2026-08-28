import Transport from "@ledgerhq/hw-transport";
import { DmkSignerXrp, LegacySignerXrp } from "@ledgerhq/live-signer-xrp";
import { createSigner, setXrpLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-xrp", () => ({
  DmkSignerXrp: jest.fn(),
  LegacySignerXrp: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmkTransport = { dmk: { id: "dmk" }, sessionId: "session-1" } as unknown as Transport;

describe("createSigner (XRP)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setXrpLdmkEnabled(false);
  });

  afterAll(() => setXrpLdmkEnabled(false));

  it("uses the legacy signer on a legacy transport, flag off", () => {
    createSigner(legacyTransport);

    expect(LegacySignerXrp).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerXrp).not.toHaveBeenCalled();
  });

  it("uses the legacy signer on a legacy transport, flag on", () => {
    setXrpLdmkEnabled(true);

    createSigner(legacyTransport);

    expect(LegacySignerXrp).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerXrp).not.toHaveBeenCalled();
  });

  it("keeps a DMK transport on the legacy signer while the flag is off", () => {
    createSigner(dmkTransport);

    expect(LegacySignerXrp).toHaveBeenCalledWith(dmkTransport);
    expect(DmkSignerXrp).not.toHaveBeenCalled();
  });

  it("uses the DMK signer on a DMK transport once the flag is on", () => {
    setXrpLdmkEnabled(true);

    createSigner(dmkTransport);

    expect(DmkSignerXrp).toHaveBeenCalledWith({ id: "dmk" }, "session-1");
    expect(LegacySignerXrp).not.toHaveBeenCalled();
  });
});

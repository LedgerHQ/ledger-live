import Transport from "@ledgerhq/hw-transport";
import { DmkSignerTron, LegacySignerTron } from "@ledgerhq/live-signer-tron";
import { createSigner, setTronLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-tron", () => ({
  DmkSignerTron: jest.fn(),
  LegacySignerTron: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmkTransport = { dmk: { id: "dmk" }, sessionId: "session-1" } as unknown as Transport;

describe("createSigner (Tron)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setTronLdmkEnabled(false);
  });

  afterAll(() => setTronLdmkEnabled(false));

  it("uses the legacy signer on a legacy transport, flag off", () => {
    createSigner(legacyTransport);

    expect(LegacySignerTron).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerTron).not.toHaveBeenCalled();
  });

  it("uses the legacy signer on a legacy transport, flag on", () => {
    setTronLdmkEnabled(true);

    createSigner(legacyTransport);

    expect(LegacySignerTron).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerTron).not.toHaveBeenCalled();
  });

  it("keeps a DMK transport on the legacy signer while the flag is off", () => {
    createSigner(dmkTransport);

    expect(LegacySignerTron).toHaveBeenCalledWith(dmkTransport);
    expect(DmkSignerTron).not.toHaveBeenCalled();
  });

  it("uses the DMK signer on a DMK transport once the flag is on", () => {
    setTronLdmkEnabled(true);

    createSigner(dmkTransport);

    expect(DmkSignerTron).toHaveBeenCalledWith({ id: "dmk" }, "session-1");
    expect(LegacySignerTron).not.toHaveBeenCalled();
  });
});

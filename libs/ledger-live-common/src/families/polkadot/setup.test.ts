import Transport from "@ledgerhq/hw-transport";
import { DmkSignerPolkadot, LegacySignerPolkadot } from "@ledgerhq/live-signer-polkadot";
import { createSigner, setPolkadotLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-polkadot", () => ({
  DmkSignerPolkadot: jest.fn(),
  LegacySignerPolkadot: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmkTransport = { dmk: { id: "dmk" }, sessionId: "session-1" } as unknown as Transport;

describe("createSigner (Polkadot device)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPolkadotLdmkEnabled(false);
  });

  afterAll(() => setPolkadotLdmkEnabled(false));

  it("uses the legacy signer on a legacy transport, flag off", () => {
    createSigner(legacyTransport);

    expect(LegacySignerPolkadot).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerPolkadot).not.toHaveBeenCalled();
  });

  it("uses the legacy signer on a legacy transport, flag on", () => {
    setPolkadotLdmkEnabled(true);

    createSigner(legacyTransport);

    expect(LegacySignerPolkadot).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerPolkadot).not.toHaveBeenCalled();
  });

  it("keeps a DMK transport on the legacy signer while the flag is off", () => {
    createSigner(dmkTransport);

    expect(LegacySignerPolkadot).toHaveBeenCalledWith(dmkTransport);
    expect(DmkSignerPolkadot).not.toHaveBeenCalled();
  });

  it("uses the DMK signer on a DMK transport once the flag is on", () => {
    setPolkadotLdmkEnabled(true);

    createSigner(dmkTransport);

    expect(DmkSignerPolkadot).toHaveBeenCalledWith({ id: "dmk" }, "session-1");
    expect(LegacySignerPolkadot).not.toHaveBeenCalled();
  });
});

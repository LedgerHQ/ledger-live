import Transport from "@ledgerhq/hw-transport";
import { DmkSignerHedera, LegacySignerHedera } from "@ledgerhq/live-signer-hedera";
import { createSigner, setHederaLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-hedera", () => ({
  DmkSignerHedera: jest.fn(),
  LegacySignerHedera: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmkTransport = { dmk: { id: "dmk" }, sessionId: "session-1" } as unknown as Transport;

describe("createSigner (Hedera)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHederaLdmkEnabled(false);
  });

  afterAll(() => setHederaLdmkEnabled(false));

  it("uses the legacy signer on a legacy transport, flag off", () => {
    createSigner(legacyTransport);

    expect(LegacySignerHedera).toHaveBeenCalledTimes(1);
    expect(LegacySignerHedera).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerHedera).not.toHaveBeenCalled();
  });

  it("uses the legacy signer on a legacy transport, flag on", () => {
    setHederaLdmkEnabled(true);

    createSigner(legacyTransport);

    expect(LegacySignerHedera).toHaveBeenCalledTimes(1);
    expect(LegacySignerHedera).toHaveBeenCalledWith(legacyTransport);
    expect(DmkSignerHedera).not.toHaveBeenCalled();
  });

  it("keeps a DMK transport on the legacy signer while the flag is off", () => {
    createSigner(dmkTransport);

    expect(LegacySignerHedera).toHaveBeenCalledTimes(1);
    expect(LegacySignerHedera).toHaveBeenCalledWith(dmkTransport);
    expect(DmkSignerHedera).not.toHaveBeenCalled();
  });

  it("uses the DMK signer on a DMK transport once the flag is on", () => {
    setHederaLdmkEnabled(true);

    createSigner(dmkTransport);

    expect(DmkSignerHedera).toHaveBeenCalledTimes(1);
    expect(DmkSignerHedera).toHaveBeenCalledWith({ id: "dmk" }, "session-1");
    expect(LegacySignerHedera).not.toHaveBeenCalled();
  });
});

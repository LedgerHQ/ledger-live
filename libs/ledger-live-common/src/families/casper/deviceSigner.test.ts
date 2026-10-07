import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerCasper, LegacySignerCasper } from "@ledgerhq/live-signer-casper";
import { createDeviceSigner, setCasperLdmkEnabled } from "./deviceSigner";

jest.mock("@ledgerhq/live-signer-casper", () => ({
  DmkSignerCasper: jest.fn(),
  LegacySignerCasper: jest.fn(),
}));

const legacyTransport = {} as Transport;
const dmk = {} as DeviceManagementKit;
const dmkTransport = { dmk, sessionId: "session-id" } as unknown as Transport;

describe("createDeviceSigner (Casper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCasperLdmkEnabled(false);
  });

  afterAll(() => setCasperLdmkEnabled(false));

  it("should use the legacy signer on a DMK transport when the ldmkCasperSigner flag is off by default", () => {
    const signer = createDeviceSigner(dmkTransport);

    expect(LegacySignerCasper).toHaveBeenCalledTimes(1);
    expect(LegacySignerCasper).toHaveBeenCalledWith(dmkTransport);
    expect(signer).toBeInstanceOf(LegacySignerCasper);
    expect(DmkSignerCasper).not.toHaveBeenCalled();
  });

  it("should use the DMK signer when the flag is on and the transport exposes a DMK session", () => {
    setCasperLdmkEnabled(true);

    const signer = createDeviceSigner(dmkTransport);

    expect(DmkSignerCasper).toHaveBeenCalledTimes(1);
    expect(DmkSignerCasper).toHaveBeenCalledWith(dmk, "session-id");
    expect(signer).toBeInstanceOf(DmkSignerCasper);
    expect(LegacySignerCasper).not.toHaveBeenCalled();
  });

  it("should use the legacy signer when the flag is on but the transport is not DMK", () => {
    setCasperLdmkEnabled(true);

    const signer = createDeviceSigner(legacyTransport);

    expect(LegacySignerCasper).toHaveBeenCalledTimes(1);
    expect(LegacySignerCasper).toHaveBeenCalledWith(legacyTransport);
    expect(signer).toBeInstanceOf(LegacySignerCasper);
    expect(DmkSignerCasper).not.toHaveBeenCalled();
  });
});

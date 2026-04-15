import { act, renderHook } from "@tests/test-renderer";
import { DeviceActionStatus, type DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import {
  LedgerKeyringProtocolBuilder,
  LKRPEnv,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { of } from "rxjs";
import { formatEncryptedProof, useLedgerProofEncryption } from "./useLedgerProofEncryption";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  useDeviceManagementKit: jest.fn(),
}));

const mockLedgerProofEncrypt = jest.fn();
const mockBuild = jest.fn();

jest.mock("@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol", () => ({
  LedgerKeyringProtocolBuilder: jest.fn().mockImplementation(() => ({
    build: mockBuild,
  })),
  LKRPEnv: {
    PROD: "prod",
  },
}));

const mockDmk = {
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const discoveredDevice = {
  id: "ble|device-1",
  name: "Nano X",
  transport: "ble",
  deviceModel: {
    id: "nanoX",
  },
} as unknown as DiscoveredDevice;

const rawProof = '{"protocol":"groth16","curve":"bn128"}';

describe("useLedgerProofEncryption", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDeviceManagementKit).mockReturnValue(mockDmk as never);
    mockBuild.mockReturnValue({
      ledgerProofEncrypt: mockLedgerProofEncrypt,
    });
    mockDmk.connect.mockResolvedValue("session-1");
    mockDmk.disconnect.mockResolvedValue(undefined);
  });

  it("should encrypt the selected proof payload when a device is selected", async () => {
    const encryptedPayload = Uint8Array.from([0xde, 0xad, 0xbe, 0xef]);
    mockLedgerProofEncrypt.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Completed,
        output: encryptedPayload,
      }),
    });

    const { result } = renderHook(() =>
      useLedgerProofEncryption(),
    );

    let encryptedProof: string | undefined;
    await act(async () => {
      encryptedProof = await result.current.encryptProofWithDevice(discoveredDevice, rawProof);
    });

    expect(LedgerKeyringProtocolBuilder).toHaveBeenCalledWith({
      dmk: mockDmk,
      applicationId: 16,
      env: LKRPEnv.PROD,
    });
    expect(mockDmk.connect).toHaveBeenCalledWith({
      device: discoveredDevice,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    expect(mockLedgerProofEncrypt).toHaveBeenCalledTimes(1);

    const encryptCall = mockLedgerProofEncrypt.mock.calls[0][0];
    expect(encryptCall.intent).toBe("+18 age attestation");
    expect(encryptCall.sessionId).toBe("session-1");
    expect(new TextDecoder().decode(encryptCall.blob)).toBe(rawProof);
    expect(encryptedProof).toBe("deadbeef");
    expect(result.current.isEncrypting).toBe(false);
    expect(mockDmk.disconnect).toHaveBeenCalledWith({ sessionId: "session-1" });
  });

  it("should disconnect and keep the hook unpaused when encryption fails", async () => {
    mockLedgerProofEncrypt.mockReturnValue({
      observable: of({
        status: DeviceActionStatus.Error,
        error: new Error("boom"),
      }),
    });

    const { result } = renderHook(() =>
      useLedgerProofEncryption(),
    );

    await act(async () => {
      await expect(result.current.encryptProofWithDevice(discoveredDevice, rawProof)).rejects.toThrow(
        "boom",
      );
    });

    expect(result.current.isEncrypting).toBe(false);
    expect(mockDmk.disconnect).toHaveBeenCalledWith({ sessionId: "session-1" });
  });

  it("should throw when DMK is unavailable", async () => {
    jest.mocked(useDeviceManagementKit).mockReturnValue(null);

    const { result } = renderHook(() =>
      useLedgerProofEncryption(),
    );

    await act(async () => {
      await expect(result.current.encryptProofWithDevice(discoveredDevice, rawProof)).rejects.toThrow(
        "DMK unavailable",
      );
    });

    expect(LedgerKeyringProtocolBuilder).not.toHaveBeenCalled();
  });

  it("should format encrypted proof as hex", () => {
    expect(formatEncryptedProof(Uint8Array.from([0x0a, 0xbc, 0x01]))).toBe("0abc01");
  });
});

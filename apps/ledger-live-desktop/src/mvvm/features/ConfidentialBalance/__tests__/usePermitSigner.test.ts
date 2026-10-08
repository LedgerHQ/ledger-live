import { act, renderHook } from "@testing-library/react";
import type { Account } from "@ledgerhq/types-live";
import { usePermitSigner } from "../hooks/usePermitSigner";
import { DeviceRefusedError, mockSignTypedData } from "../utils/confidentialApi";
import { isRealConfidentialApi } from "../utils/confidentialRuntime";
import { signPermitOnDevice } from "../utils/devicePermitSigner";

jest.mock("../utils/confidentialRuntime", () => ({ isRealConfidentialApi: jest.fn() }));
jest.mock("../utils/devicePermitSigner", () => ({ signPermitOnDevice: jest.fn() }));
jest.mock("../utils/confidentialApi", () => ({
  ...jest.requireActual("../utils/confidentialApi"),
  mockSignTypedData: jest.fn(async () => "0xmock"),
}));

const parentAccount = {
  freshAddressPath: "44'/60'/0'/0/0",
  currency: { managerAppName: "Ethereum" },
} as Account;
const typedData = { domain: {}, types: {}, primaryType: "Permit", message: {} };

beforeEach(() => {
  jest.mocked(isRealConfidentialApi).mockReturnValue(true);
  jest.mocked(signPermitOnDevice).mockReset();
  jest.mocked(mockSignTypedData).mockClear();
});

describe("usePermitSigner", () => {
  it("keeps the mock signer, and no device prompt, on the mock API", async () => {
    jest.mocked(isRealConfidentialApi).mockReturnValue(false);
    const { result } = renderHook(() => usePermitSigner(parentAccount));

    await expect(result.current.signTypedData(typedData)).resolves.toBe("0xmock");

    expect(result.current.deviceSignature.isOpen).toBe(false);
    expect(signPermitOnDevice).not.toHaveBeenCalled();
  });

  it("asks for the device, then signs the permit on the account's path", async () => {
    jest.mocked(signPermitOnDevice).mockResolvedValue("0xsigned");
    const { result } = renderHook(() => usePermitSigner(parentAccount));

    let signature: Promise<string> | undefined;
    act(() => {
      signature = result.current.signTypedData(typedData);
    });
    expect(result.current.deviceSignature.isOpen).toBe(true);
    expect(result.current.deviceSignature.appName).toBe("Ethereum");

    await act(() => result.current.deviceSignature.onDeviceConnected("device-1"));

    await expect(signature).resolves.toBe("0xsigned");
    expect(signPermitOnDevice).toHaveBeenCalledWith("device-1", "44'/60'/0'/0/0", typedData);
    expect(result.current.deviceSignature.isOpen).toBe(false);
  });

  it("passes a device failure back to the reveal", async () => {
    const refusal = Object.assign(new Error("refused"), { name: "UserRefusedOnDevice" });
    jest.mocked(signPermitOnDevice).mockRejectedValue(refusal);
    const { result } = renderHook(() => usePermitSigner(parentAccount));

    let outcome: Promise<unknown> | undefined;
    act(() => {
      outcome = result.current.signTypedData(typedData).catch(error => error);
    });
    await act(() => result.current.deviceSignature.onDeviceConnected("device-1"));

    await expect(outcome).resolves.toBe(refusal);
  });

  it("treats closing the device dialog as a refusal", async () => {
    const { result } = renderHook(() => usePermitSigner(parentAccount));

    let outcome: Promise<unknown> | undefined;
    act(() => {
      outcome = result.current.signTypedData(typedData).catch(error => error);
    });
    act(() => result.current.deviceSignature.onCancel());

    await expect(outcome).resolves.toBeInstanceOf(DeviceRefusedError);
    expect(result.current.deviceSignature.isOpen).toBe(false);
  });
});

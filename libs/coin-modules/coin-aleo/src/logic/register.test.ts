import { log } from "@ledgerhq/logs";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import { register } from "./register";

jest.mock("../network/api");
jest.mock("../network/sdk");
jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const mockGetScannerPublicKey = jest.mocked(apiClient.getScannerPublicKey);
const mockEncryptRegistrationPayload = jest.mocked(sdkClient.encryptRegistrationPayload);
const mockRegisterForScanning = jest.mocked(apiClient.registerForScanningAccountRecordsEncrypted);
const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockLog = jest.mocked(log);

describe("register", () => {
  const config = getMockedConfig("mainnet");
  const viewKey = "AViewKey1mockviewkey";
  const publicKey = "aleo1publickey";
  const keyId = "key-id-123";
  const encryptedData = "encrypted-data-xyz";
  const provableId = "uuid-abc-def";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScannerPublicKey.mockResolvedValue({ public_key: publicKey, key_id: keyId });
    mockEncryptRegistrationPayload.mockResolvedValue({ encrypted: encryptedData });
    mockRegisterForScanning.mockResolvedValue({ uuid: provableId });
  });

  it("performs exactly the three seal-and-enroll calls, in order, and returns the handle", async () => {
    const result = await register(config, viewKey);

    expect(result).toEqual({ type: "aleo", provableId });

    expect(mockGetScannerPublicKey).toHaveBeenCalledTimes(1);
    expect(mockEncryptRegistrationPayload).toHaveBeenCalledTimes(1);
    expect(mockRegisterForScanning).toHaveBeenCalledTimes(1);

    const pubkeyOrder = mockGetScannerPublicKey.mock.invocationCallOrder[0];
    const encryptOrder = mockEncryptRegistrationPayload.mock.invocationCallOrder[0];
    const registerOrder = mockRegisterForScanning.mock.invocationCallOrder[0];
    expect(pubkeyOrder).toBeLessThan(encryptOrder);
    expect(encryptOrder).toBeLessThan(registerOrder);
  });

  it("passes the scanner public key and view key to encrypt_registration with start=0", async () => {
    await register(config, viewKey);

    expect(mockGetScannerPublicKey).toHaveBeenCalledWith(config);
    expect(mockEncryptRegistrationPayload).toHaveBeenCalledWith({
      config,
      publicKey,
      viewKey,
      start: 0,
    });
  });

  it("hands the scanner only key_id + ciphertext — never the raw view key", async () => {
    await register(config, viewKey);

    expect(mockRegisterForScanning).toHaveBeenCalledWith({
      config,
      encryptedData,
      keyId,
    });

    const scannerCallArgs = mockRegisterForScanning.mock.calls[0][0];
    expect(JSON.stringify(scannerCallArgs)).not.toContain(viewKey);
  });

  it("never reads the scanner /status endpoint", async () => {
    await register(config, viewKey);

    expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
  });

  it("never logs the view key, the sealed ciphertext or the provableId", async () => {
    await register(config, viewKey);

    const loggedText = mockLog.mock.calls.map(call => JSON.stringify(call)).join(" ");
    expect(loggedText).not.toContain(viewKey);
    expect(loggedText).not.toContain(encryptedData);
    expect(loggedText).not.toContain(provableId);
  });

  it("fails the view-key invariant before any network call when the view key is empty", async () => {
    await expect(register(config, "")).rejects.toThrow(/view key is required/);

    expect(mockGetScannerPublicKey).not.toHaveBeenCalled();
    expect(mockEncryptRegistrationPayload).not.toHaveBeenCalled();
    expect(mockRegisterForScanning).not.toHaveBeenCalled();
  });

  it("keeps the raw view key out of the invariant message", async () => {
    await expect(register(config, "")).rejects.toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("AViewKey") }),
    );
  });
});

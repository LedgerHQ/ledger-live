import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account } from "@ledgerhq/types-live";
import { signMessage } from "./hw-signMessage";
import { CasperSigner, CasperSignature } from "./types";

describe("hw-signMessage", () => {
  // Test fixtures
  const mockDeviceId = "device_123";

  // Only define the properties actually used by the signMessage function
  const mockAccount = {
    freshAddressPath: "44'/506'/0'/0/1",
  } as unknown as Account;

  // Mock signature response
  const mockSignatureResponse: CasperSignature = {
    errorMessage: "",
    returnCode: 0x9000,
    signatureRS: Buffer.from(
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
      "hex",
    ),
    signatureRSV: Buffer.from(
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff01",
      "hex",
    ),
    signature_compact: new Uint8Array(
      Buffer.from("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff01", "hex"),
    ),
  };

  // Mock a successful signer
  const mockSigner: CasperSigner = {
    showAddressAndPubKey: jest.fn(),
    getAddressAndPubKey: jest.fn(),
    sign: jest.fn().mockResolvedValue(mockSignatureResponse),
  };

  // Mock signerContext function
  const mockSignerContext: SignerContext<CasperSigner> = jest.fn((deviceId, callback) =>
    callback(mockSigner),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should sign a plain text message correctly", async () => {
    const message = "Hello Casper Network";
    const result = await signMessage(mockSignerContext)(mockDeviceId, mockAccount, { message });

    // Verify the signer was called with correct parameters
    expect(mockSignerContext).toHaveBeenCalledWith(mockDeviceId, expect.any(Function));
    expect(mockSigner.sign).toHaveBeenCalledWith(mockAccount.freshAddressPath, expect.any(Buffer));

    // Verify the correct signature format is returned
    expect(result).toEqual({
      rsv: {
        r: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
        s: "01",
        v: NaN,
      },
      signature: "0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff01",
    });
  });

  test("should sign a hex message correctly", async () => {
    const message = "0x123456789abcdef";
    const result = await signMessage(mockSignerContext)(mockDeviceId, mockAccount, { message });

    expect(mockSigner.sign).toHaveBeenCalledWith(mockAccount.freshAddressPath, expect.any(Buffer));
    expect(result.signature).toBe(
      "0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff01",
    );
  });

  test("should sign a base64 message correctly", async () => {
    const message = "SGVsbG8gQ2FzcGVyIE5ldHdvcms="; // "Hello Casper Network" in base64
    const result = await signMessage(mockSignerContext)(mockDeviceId, mockAccount, { message });

    expect(mockSigner.sign).toHaveBeenCalledWith(mockAccount.freshAddressPath, expect.any(Buffer));
    expect(result.signature).toBe(
      "0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff01",
    );
  });

  test("should throw error if message is empty", async () => {
    await expect(
      signMessage(mockSignerContext)(mockDeviceId, mockAccount, { message: "" }),
    ).rejects.toThrow("Message cannot be empty");
  });

  test("should throw error if message is undefined", async () => {
    await expect(
      signMessage(mockSignerContext)(mockDeviceId, mockAccount, { message: undefined as any }),
    ).rejects.toThrow("Message cannot be empty");
  });

  test("should throw error if message is not a string", async () => {
    await expect(
      signMessage(mockSignerContext)(mockDeviceId, mockAccount, {
        message: { type: "EIP712" } as any,
      }),
    ).rejects.toThrow("Signing EIP712Message not supported");
  });

  test("should propagate errors from the signer", async () => {
    // Mock an error from the signer
    const errorSigner: CasperSigner = {
      showAddressAndPubKey: jest.fn(),
      getAddressAndPubKey: jest.fn(),
      sign: jest.fn().mockRejectedValue(new Error("Device disconnected")),
    };

    const errorSignerContext: SignerContext<CasperSigner> = jest.fn((deviceId, callback) =>
      callback(errorSigner),
    );

    await expect(
      signMessage(errorSignerContext)(mockDeviceId, mockAccount, { message: "test" }),
    ).rejects.toThrow("Device disconnected");
  });
});

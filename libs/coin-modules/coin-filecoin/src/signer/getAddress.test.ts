import resolver from "./getAddress";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FilecoinSigner } from "../types";

jest.mock("@ledgerhq/logs");

describe("getAddress resolver", () => {
  const mockSigner: FilecoinSigner = {
    getAddressAndPubKey: jest.fn(),
    showAddressAndPubKey: jest.fn(),
    sign: jest.fn(),
    getVersion: jest.fn(),
    appInfo: jest.fn(),
  };

  const mockSignerContext: SignerContext<FilecoinSigner> = jest.fn(
    async (_deviceId, fn) => await fn(mockSigner),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get address without verification", async () => {
    const mockResult = {
      addrString: "f1testaddress",
      compressed_pk: new Uint8Array([1, 2, 3, 4]),
    };

    (mockSigner.getAddressAndPubKey as jest.Mock).mockResolvedValue(mockResult);

    const getAddress = resolver(mockSignerContext);
    const result = await getAddress("device-id", { path: "m/44'/461'/0'/0/0", verify: false });

    expect(mockSigner.getAddressAndPubKey).toHaveBeenCalledWith("m/44'/461'/0'/0/0");
    expect(mockSigner.showAddressAndPubKey).not.toHaveBeenCalled();
    expect(result.address).toBe("f1testaddress");
    expect(result.path).toBe("m/44'/461'/0'/0/0");
    expect(result.publicKey).toBe("01020304");
  });

  it("should get address with verification (show on device)", async () => {
    const mockResult = {
      addrString: "f1verifiedaddress",
      compressed_pk: new Uint8Array([5, 6, 7, 8]),
    };

    (mockSigner.showAddressAndPubKey as jest.Mock).mockResolvedValue(mockResult);

    const getAddress = resolver(mockSignerContext);
    const result = await getAddress("device-id", { path: "m/44'/461'/0'/0/0", verify: true });

    expect(mockSigner.showAddressAndPubKey).toHaveBeenCalledWith("m/44'/461'/0'/0/0");
    expect(mockSigner.getAddressAndPubKey).not.toHaveBeenCalled();
    expect(result.address).toBe("f1verifiedaddress");
    expect(result.path).toBe("m/44'/461'/0'/0/0");
    expect(result.publicKey).toBe("05060708");
  });

  it("should handle different derivation paths", async () => {
    const mockResult = {
      addrString: "f1otherpath",
      compressed_pk: new Uint8Array([9, 10]),
    };

    (mockSigner.getAddressAndPubKey as jest.Mock).mockResolvedValue(mockResult);

    const getAddress = resolver(mockSignerContext);
    const result = await getAddress("device-id", { path: "m/44'/461'/1'/0/5", verify: false });

    expect(mockSigner.getAddressAndPubKey).toHaveBeenCalledWith("m/44'/461'/1'/0/5");
    expect(result.path).toBe("m/44'/461'/1'/0/5");
  });

  it("should throw when signer fails", async () => {
    (mockSigner.getAddressAndPubKey as jest.Mock).mockRejectedValue(new Error("Device error"));

    const getAddress = resolver(mockSignerContext);

    await expect(
      getAddress("device-id", { path: "m/44'/461'/0'/0/0", verify: false }),
    ).rejects.toThrow("Device error");
  });
});

import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import resolver from "./hw-getAddress";
import type { AlgorandSigner } from "./signer";

describe("hw-getAddress", () => {
  describe("resolver", () => {
    it("should return a function", () => {
      const mockSignerContext = jest.fn() as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      expect(typeof getAddressFn).toBe("function");
    });

    it("should call signerContext with deviceId and signer function", async () => {
      const mockAddress = "ALGO_ADDRESS_123";
      const mockPublicKey = "PUBLIC_KEY_ABC";
      const mockSignerContext = jest.fn().mockResolvedValue({
        address: mockAddress,
        publicKey: mockPublicKey,
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      await getAddressFn("device-123", { path: "44'/283'/0'/0/0" });

      expect(mockSignerContext).toHaveBeenCalledWith("device-123", expect.any(Function));
    });

    it("should return address, publicKey, and path", async () => {
      const mockAddress = "ALGO_ADDRESS_456";
      const mockPublicKey = "PUBLIC_KEY_DEF";
      const mockSignerContext = jest.fn().mockResolvedValue({
        address: mockAddress,
        publicKey: mockPublicKey,
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);
      const path = "44'/283'/0'/0/0";

      const result = await getAddressFn("device-1", { path });

      expect(result).toEqual({
        address: mockAddress,
        publicKey: mockPublicKey,
        path,
      });
    });

    it("should pass verify=false when not provided", async () => {
      const mockGetAddress = jest.fn().mockResolvedValue({
        address: "ADDR",
        publicKey: "PK",
      });
      const mockSignerContext = jest.fn().mockImplementation((deviceId, fn) => {
        return fn({ getAddress: mockGetAddress });
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      await getAddressFn("device-1", { path: "44'/283'/0'/0/0" });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/283'/0'/0/0", false);
    });

    it("should pass verify=true when provided", async () => {
      const mockGetAddress = jest.fn().mockResolvedValue({
        address: "ADDR",
        publicKey: "PK",
      });
      const mockSignerContext = jest.fn().mockImplementation((deviceId, fn) => {
        return fn({ getAddress: mockGetAddress });
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      await getAddressFn("device-1", { path: "44'/283'/0'/0/0", verify: true });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/283'/0'/0/0", true);
    });

    it("should handle different device IDs", async () => {
      const mockSignerContext = jest.fn().mockResolvedValue({
        address: "ADDR",
        publicKey: "PK",
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      await getAddressFn("nano-s-device", { path: "44'/283'/0'/0/0" });

      expect(mockSignerContext).toHaveBeenCalledWith("nano-s-device", expect.any(Function));
    });

    it("should handle different derivation paths", async () => {
      const mockGetAddress = jest.fn().mockResolvedValue({
        address: "ADDR",
        publicKey: "PK",
      });
      const mockSignerContext = jest.fn().mockImplementation((deviceId, fn) => {
        return fn({ getAddress: mockGetAddress });
      }) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);
      const customPath = "44'/283'/1'/0/5";

      await getAddressFn("device-1", { path: customPath });

      expect(mockGetAddress).toHaveBeenCalledWith(customPath, false);
    });

    it("should propagate errors from signerContext", async () => {
      const mockError = new Error("Device disconnected");
      const mockSignerContext = jest
        .fn()
        .mockRejectedValue(mockError) as unknown as SignerContext<AlgorandSigner>;

      const getAddressFn = resolver(mockSignerContext);

      await expect(getAddressFn("device-1", { path: "44'/283'/0'/0/0" })).rejects.toThrow(
        "Device disconnected",
      );
    });
  });
});

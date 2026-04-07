import Celo from "@ledgerhq/hw-app-celo";
import { EIP712Message } from "@ledgerhq/types-live";
import { LegacySignerCelo } from "../src/LegacySignerCelo";
import { ResolutionConfig, LoadConfig } from "@ledgerhq/hw-app-eth/services/types";

jest.mock("@ledgerhq/hw-app-celo");

describe("LegacySignerCelo", () => {
  const celoMock = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
    signPersonalMessage: jest.fn(),
    signEIP712Message: jest.fn(),
    signEIP712HashedMessage: jest.fn(),
    clearSignTransaction: jest.fn(),
    setLoadConfig: jest.fn(),
    rlpEncodedTxForLedger: jest.fn(),
  };

  let signer: LegacySignerCelo;

  beforeEach(() => {
    (Celo as jest.Mock).mockImplementation(() => celoMock);
    jest.clearAllMocks();
    signer = new LegacySignerCelo({} as any);
  });

  describe("getAddress", () => {
    it("should get the address without boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      celoMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: undefined,
      });

      // WHEN
      const result = await signer.getAddress(path);

      // THEN
      expect(celoMock.getAddress).toHaveBeenCalledWith(path, undefined, undefined, undefined);
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: undefined,
      });
    });

    it("should get the address with boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      celoMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });

      // WHEN
      const result = await signer.getAddress(path, true, true);

      // THEN
      expect(celoMock.getAddress).toHaveBeenCalledWith(path, true, true, undefined);
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });
    });

    it("should get the address with chainId", async () => {
      // GIVEN
      const path = "path";
      const chainId = "42220";
      celoMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });

      // WHEN
      const result = await signer.getAddress(path, true, true, chainId);

      // THEN
      expect(celoMock.getAddress).toHaveBeenCalledWith(path, true, true, chainId);
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });
    });
  });

  describe("signPersonalMessage", () => {
    it("should sign the personal message", async () => {
      // GIVEN
      const path = "path";
      const messageHex = "0x010203040506";
      const signature = { r: "01", s: "02", v: 3 };
      celoMock.signPersonalMessage.mockResolvedValue(signature);

      // WHEN
      const result = await signer.signPersonalMessage(path, messageHex);

      // THEN
      expect(celoMock.signPersonalMessage).toHaveBeenCalledWith(path, messageHex);
      expect(result).toEqual(signature);
    });
  });

  describe("signTransaction", () => {
    it("should sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const signature = { r: "01", s: "02", v: 3 };
      celoMock.signTransaction.mockResolvedValue(signature);

      // WHEN
      const result = await signer.signTransaction(path, rawTxHex);

      // THEN
      expect(celoMock.signTransaction).toHaveBeenCalledWith(path, rawTxHex);
      expect(result).toEqual(signature);
    });
  });

  describe("signEIP712Message", () => {
    it("should sign the EIP712 message", async () => {
      // GIVEN
      const path = "path";
      const message = { message: "message" } as unknown as EIP712Message;
      const signature = { r: "01", s: "02", v: 3 };
      celoMock.signEIP712Message.mockResolvedValue(signature);

      // WHEN
      const result = await signer.signEIP712Message(path, message);

      // THEN
      expect(celoMock.signEIP712Message).toHaveBeenCalledWith(path, message, undefined);
      expect(result).toEqual(signature);
    });
  });

  describe("signEIP712HashedMessage", () => {
    it("should sign the EIP712 hashed message", async () => {
      // GIVEN
      const path = "path";
      const domainSeparatorHex = "domainSeparatorHex";
      const hashStructMessageHex = "hashStructMessageHex";
      const signature = { r: "01", s: "02", v: 3 };
      celoMock.signEIP712HashedMessage.mockResolvedValue(signature);

      // WHEN
      const result = await signer.signEIP712HashedMessage(
        path,
        domainSeparatorHex,
        hashStructMessageHex,
      );

      // THEN
      expect(celoMock.signEIP712HashedMessage).toHaveBeenCalledWith(
        path,
        domainSeparatorHex,
        hashStructMessageHex,
      );
      expect(result).toEqual(signature);
    });
  });

  describe("clearSignTransaction", () => {
    it("should clear sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const resolutionConfig: ResolutionConfig = {
        erc20: true,
        externalPlugins: true,
        nft: true,
      };
      const signature = { r: "01", s: "02", v: 3 };
      celoMock.clearSignTransaction.mockResolvedValue(signature);

      // WHEN
      const result = await signer.clearSignTransaction(path, rawTxHex, resolutionConfig, true);

      // THEN
      expect(celoMock.clearSignTransaction).toHaveBeenCalledWith(
        path,
        rawTxHex,
        resolutionConfig,
        true,
      );
      expect(result).toEqual(signature);
    });
  });

  describe("setLoadConfig", () => {
    it("should set the load config", () => {
      // GIVEN
      const config: LoadConfig = {
        nftExplorerBaseURL: "https://nft-explorer.example.com",
        pluginBaseURL: "https://plugins.example.com",
        extraPlugins: null,
        cryptoassetsBaseURL: "https://cryptoassets.example.com",
        calServiceURL: "https://cal.example.com",
      };

      // WHEN
      signer.setLoadConfig(config);

      // THEN
      expect(celoMock.setLoadConfig).toHaveBeenCalledWith(config);
    });
  });

  describe("rlpEncodedTxForLedger", () => {
    it("should encode the transaction for ledger", async () => {
      // GIVEN
      const txParams = { from: "0x123", to: "0x456", value: "0x0" } as any;
      const encoded = { rlpEncode: "0xabcdef", type: "cip42" } as any;
      celoMock.rlpEncodedTxForLedger.mockResolvedValue(encoded);

      // WHEN
      const result = await signer.rlpEncodedTxForLedger(txParams);

      // THEN
      expect(celoMock.rlpEncodedTxForLedger).toHaveBeenCalledWith(txParams);
      expect(result).toEqual(encoded);
    });
  });
});

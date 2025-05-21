import Eth from "@ledgerhq/hw-app-eth";
import { EIP712Message } from "@ledgerhq/types-live";
import { lastValueFrom } from "rxjs";
import { LegacySignerEth } from "../src/LegacySignerEth";
import { ResolutionConfig, LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

jest.mock("@ledgerhq/hw-app-eth");

describe("LegacySignerEth", () => {
  const ethMock = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
    signPersonalMessage: jest.fn(),
    signEIP712Message: jest.fn(),
    signEIP712HashedMessage: jest.fn(),
    clearSignTransaction: jest.fn(),
    setLoadConfig: jest.fn(),
  };

  let signer: LegacySignerEth;

  beforeEach(() => {
    jest.clearAllMocks();
    (Eth as jest.Mock).mockImplementation(() => ethMock);
    signer = new LegacySignerEth({} as any);
  });

  describe("getAddress", () => {
    it("should get the address without boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      ethMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: undefined,
      });

      // WHEN
      const result = await signer.getAddress(path);

      // THEN
      expect(ethMock.getAddress).toHaveBeenCalledWith(path, undefined, undefined, undefined);
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: undefined,
      });
    });

    it("should get the address with boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      ethMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });

      // WHEN
      const result = await signer.getAddress(path, true, true);

      // THEN
      expect(ethMock.getAddress).toHaveBeenCalledWith(path, true, true, undefined);
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });
    });

    it("should get the address with chainId", async () => {
      // GIVEN
      const path = "path";
      const chainId = "1";
      ethMock.getAddress.mockResolvedValue({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });

      // WHEN
      const result = await signer.getAddress(path, true, true, chainId);

      // THEN
      expect(ethMock.getAddress).toHaveBeenCalledWith(path, true, true, chainId);
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
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signPersonalMessage.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(signer.signPersonalMessage(path, messageHex));

      // THEN
      expect(ethMock.signPersonalMessage).toHaveBeenCalledWith(path, messageHex);
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });
  });

  describe("signTransaction", () => {
    it("should sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signTransaction.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex));

      // THEN
      expect(ethMock.signTransaction).toHaveBeenCalledWith(path, rawTxHex, undefined);
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });

    it("should sign the transaction with resolution", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const resolution = { some: "resolution" };
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signTransaction.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex, resolution));

      // THEN
      expect(ethMock.signTransaction).toHaveBeenCalledWith(path, rawTxHex, resolution);
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });
  });

  describe("signEIP712Message", () => {
    it("should sign the EIP712 message", async () => {
      // GIVEN
      const path = "path";
      const message = { message: "message" } as unknown as EIP712Message;
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signEIP712Message.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(signer.signEIP712Message(path, message));

      // THEN
      expect(ethMock.signEIP712Message).toHaveBeenCalledWith(path, message, undefined);
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });

    it("should sign the EIP712 message with fullImplem", async () => {
      // GIVEN
      const path = "path";
      const message = { message: "message" } as unknown as EIP712Message;
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signEIP712Message.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(signer.signEIP712Message(path, message, true));

      // THEN
      expect(ethMock.signEIP712Message).toHaveBeenCalledWith(path, message, true);
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });
  });

  describe("signEIP712HashedMessage", () => {
    it("should sign the EIP712 hashed message", async () => {
      // GIVEN
      const path = "path";
      const domainSeparatorHex = "domainSeparatorHex";
      const hashStructMessageHex = "hashStructMessageHex";
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.signEIP712HashedMessage.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(
        signer.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex),
      );

      // THEN
      expect(ethMock.signEIP712HashedMessage).toHaveBeenCalledWith(
        path,
        domainSeparatorHex,
        hashStructMessageHex,
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
    });
  });

  describe("clearSignTransaction", () => {
    it("should sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const resolutionConfig: ResolutionConfig = {
        erc20: true,
        externalPlugins: true,
        nft: true,
      };
      const signature = {
        r: "01",
        s: "02",
        v: 3,
      };
      ethMock.clearSignTransaction.mockResolvedValue(signature);

      // WHEN
      const result = await lastValueFrom(
        signer.clearSignTransaction(path, rawTxHex, resolutionConfig, true),
      );

      // THEN
      expect(ethMock.clearSignTransaction).toHaveBeenCalledWith(
        path,
        rawTxHex,
        resolutionConfig,
        true,
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: signature,
      });
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
      expect(ethMock.setLoadConfig).toHaveBeenCalledWith(config);
    });
  });
});

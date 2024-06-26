import AppBinding from "@ledgerhq/hw-app-eth";
import { DefaultKeyringEth } from "./DefaultKeyringEth";
import { ethers } from "ethers";
import { EIP712Params, KeyringEth } from "./KeyringEth";
import { ContextModule } from "@ledgerhq/context-module/lib/ContextModule";
import { ClearSignContext } from "@ledgerhq/context-module";
import { EIP712Message } from "@ledgerhq/types-live";
import LL from "@ledgerhq/coin-evm/types/index";
import BigNumber from "bignumber.js";

describe("DefaultKeyringEth", () => {
  let keyring: KeyringEth;
  const defaultTransaction: ethers.Transaction = {
    chainId: 1,
    to: "0x0123456789ABCDEF0123456789ABCDEF01234567",
    data: "0x",
    nonce: 1,
    gasLimit: ethers.BigNumber.from(0),
    gasPrice: ethers.BigNumber.from(0),
    value: ethers.BigNumber.from(1),
  };

  const mockAppBinding = {
    provideDomainName: jest.fn(),
    provideERC20TokenInformation: jest.fn(),
    provideNFTInformation: jest.fn(),
    setExternalPlugin: jest.fn(),
    setPlugin: jest.fn(),
    getChallenge: jest.fn(),
    signTransaction: jest.fn(),
    signPersonalMessage: jest.fn(),
    signEIP712Message: jest.fn(),
    signEIP712HashedMessage: jest.fn(),
    getAddress: jest.fn(),
  } as unknown as AppBinding;
  const mockContextModule = {
    getContexts: jest.fn(),
  } as ContextModule;

  beforeEach(() => {
    jest.clearAllMocks();
    keyring = new DefaultKeyringEth(mockAppBinding, mockContextModule);
    jest.spyOn(mockAppBinding, "signTransaction").mockResolvedValue({ r: "", s: "", v: "42" });
    jest.spyOn(mockAppBinding, "signPersonalMessage").mockResolvedValue({ r: "", s: "", v: 42 });
    jest.spyOn(mockAppBinding, "signEIP712Message").mockResolvedValue({ r: "", s: "", v: 42 });
    jest
      .spyOn(mockAppBinding, "getAddress")
      .mockResolvedValue({ publicKey: "0x000", address: "0x000" });
    jest
      .spyOn(mockAppBinding, "signEIP712HashedMessage")
      .mockResolvedValue({ r: "", s: "", v: 42 });
  });

  describe("signTransaction calls", () => {
    it("should call app binding provide with one context provided", async () => {
      // GIVEN
      const payload = "payload";
      const contexts: ClearSignContext[] = [{ type: "provideDomainName", payload }];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", defaultTransaction, {});

      // THEN
      expect(mockAppBinding.provideDomainName).toHaveBeenCalledWith(payload);
      expect(mockAppBinding.provideERC20TokenInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.provideNFTInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call multiple app binding provide", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2"];
      const contexts: ClearSignContext[] = [
        { type: "provideERC20TokenInformation", payload: payloads[0] },
        { type: "provideNFTInformation", payload: payloads[1] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", defaultTransaction);

      // THEN
      expect(mockAppBinding.provideDomainName).not.toHaveBeenCalled();
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideNFTInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call the same multiple app binding provide multiple times", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2", "payload3"];
      const contexts: ClearSignContext[] = [
        { type: "provideERC20TokenInformation", payload: payloads[0] },
        { type: "provideERC20TokenInformation", payload: payloads[1] },
        { type: "provideERC20TokenInformation", payload: payloads[2] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", defaultTransaction);

      // THEN
      expect(mockAppBinding.provideDomainName).not.toHaveBeenCalled();
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[2]);
      expect(mockAppBinding.provideNFTInformation).not.toHaveBeenCalled();
      expect(mockAppBinding.setExternalPlugin).not.toHaveBeenCalled();
      expect(mockAppBinding.setPlugin).not.toHaveBeenCalled();
    });

    it("should call all app binding provide", async () => {
      // GIVEN
      const payloads = ["payload1", "payload2", "payload3", "payload4", "payload5"];
      const contexts: ClearSignContext[] = [
        { type: "provideDomainName", payload: payloads[0] },
        { type: "provideERC20TokenInformation", payload: payloads[1] },
        { type: "provideNFTInformation", payload: payloads[2] },
        { type: "setExternalPlugin", payload: payloads[3] },
        { type: "setPlugin", payload: payloads[4] },
      ];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      await keyring.signTransaction("", defaultTransaction);

      // THEN
      expect(mockAppBinding.provideDomainName).toHaveBeenCalledWith(payloads[0]);
      expect(mockAppBinding.provideERC20TokenInformation).toHaveBeenCalledWith(payloads[1]);
      expect(mockAppBinding.provideNFTInformation).toHaveBeenCalledWith(payloads[2]);
      expect(mockAppBinding.setExternalPlugin).toHaveBeenCalledWith(payloads[3]);
      expect(mockAppBinding.setPlugin).toHaveBeenCalledWith(payloads[4]);
    });

    it("should handle error context", async () => {
      // GIVEN
      const contexts: ClearSignContext[] = [{ type: "error", error: new Error() }];
      jest.spyOn(mockContextModule, "getContexts").mockResolvedValue(contexts);

      // WHEN
      const response = await keyring.signTransaction("", defaultTransaction);

      // THEN
      expect(response).toEqual({ r: "0x", s: "0x", v: 66 });
    });

    it("should provide a challenge to the context module", async () => {
      // GIVEN
      const challenge = "challenge";
      jest.spyOn(mockAppBinding, "getChallenge").mockResolvedValue(challenge);

      // WHEN
      await keyring.signTransaction("", defaultTransaction);

      // THEN
      expect(mockContextModule.getContexts).toHaveBeenCalledWith(
        expect.objectContaining({ challenge }),
      );
    });

    it("sould provide a domain to the context module", async () => {
      // GIVEN
      const domain = "domain";

      // WHEN
      await keyring.signTransaction("", defaultTransaction, { domain });

      // THEN
      expect(mockContextModule.getContexts).toHaveBeenCalledWith(
        expect.objectContaining({ domain }),
      );
    });

    it("should call app binding signTransaction", async () => {
      // GIVEN
      const derivationPath = "derivationPath";

      // WHEN
      await keyring.signTransaction(derivationPath, defaultTransaction, {});

      // THEN
      expect(mockAppBinding.signTransaction).toHaveBeenCalledWith(
        derivationPath,
        "dd018080940123456789abcdef0123456789abcdef012345670180018080",
        null,
      );
    });

    it("should call app binding signTransaction with an LL type", async () => {
      // GIVEN
      const transaction: LL.Transaction = {
        chainId: 1,
        recipient: "",
        amount: new BigNumber(1),
        gasLimit: new BigNumber(1),
        gasPrice: new BigNumber(1),
        family: "evm",
        nonce: 1,
        mode: "send",
      };
      const derivationPath = "derivationPath";

      // WHEN
      await keyring.signTransaction(derivationPath, transaction);

      // THEN
      expect(mockAppBinding.signTransaction).toHaveBeenCalledWith(
        derivationPath,
        "c9010101800180018080",
        null,
      );
    });
  });

  describe("signMessage calls", () => {
    describe("personalSign", () => {
      it("should sign a string message", async () => {
        // GIVEN
        const message = "message";
        const derivationPath = "derivationPath";

        // WHEN
        const result = await keyring.signMessage(derivationPath, message, {
          method: "personalSign",
        });

        // THEN
        expect(mockAppBinding.signPersonalMessage).toHaveBeenCalledWith(
          derivationPath,
          Buffer.from(message).toString("hex"),
        );
        expect(result).toEqual({ r: "", s: "", v: 42 });
      });
    });

    describe("eip712", () => {
      it("should sign an EIP712 message", async () => {
        // GIVEN
        const message = {
          domain: {
            chainId: 1,
            verifyingContract: "",
          },
          primaryType: "",
          message: {},
          types: {},
        } as EIP712Message;
        const derivationPath = "derivationPath";

        // WHEN
        const result = await keyring.signMessage(derivationPath, message, {
          method: "eip712",
        });

        // THEN
        expect(mockAppBinding.signEIP712Message).toHaveBeenCalledWith(derivationPath, message);
        expect(result).toEqual({ r: "", s: "", v: 42 });
      });

      it("should fallback to eip712Hashed if signEIP712Message fails with an INS_NOT_SUPPORTED error", async () => {
        // GIVEN
        const message: EIP712Message = {
          domain: {
            chainId: 5,
            name: "Ether Mail",
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
            version: "1",
          },
          message: {
            val: "0x973bb640",
          },
          primaryType: "Test",
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Test: [{ name: "val", type: "bytes4" }],
          },
        };
        const derivationPath = "derivationPath";
        const error = new Error();
        (error as any).statusText = "INS_NOT_SUPPORTED";
        jest.spyOn(mockAppBinding, "signEIP712Message").mockRejectedValue(error);

        // WHEN
        const result = await keyring.signMessage(derivationPath, message, {
          method: "eip712",
        });

        // THEN
        expect(mockAppBinding.signEIP712HashedMessage).toHaveBeenCalledWith(
          derivationPath,
          "6137beb405d9ff777172aa879e33edb34a1460e701802746c5ef96e741710e59",
          "90418913cbd47e54cfb74964f7c7905cc502076a3d59974cfc2d79a16261df09",
        );
        expect(result).toEqual({ r: "", s: "", v: 42 });
      });

      it("should throw an error if signEIP712Message fails with an error other than INS_NOT_SUPPORTED", async () => {
        // GIVEN
        const message: EIP712Message = {
          domain: {
            chainId: 5,
            name: "Ether Mail",
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
            version: "1",
          },
          message: {
            val: "0x973bb640",
          },
          primaryType: "Test",
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Test: [{ name: "val", type: "bytes4" }],
          },
        };
        const derivationPath = "derivationPath";
        const error = new Error();
        jest.spyOn(mockAppBinding, "signEIP712Message").mockRejectedValue(error);

        // WHEN
        const promise = keyring.signMessage(derivationPath, message, { method: "eip712" });

        // THEN
        expect(promise).rejects.toEqual(error);
        expect(mockAppBinding.signEIP712HashedMessage).not.toHaveBeenCalled();
      });
    });

    describe("eip712Hashed", () => {
      it("should sign an EIP712 message", async () => {
        // GIVEN

        const message: EIP712Message = {
          domain: {
            chainId: 5,
            name: "Ether Mail",
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
            version: "1",
          },
          message: {
            val: "0x973bb640",
          },
          primaryType: "Test",
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Test: [{ name: "val", type: "bytes4" }],
          },
        };

        const derivationPath = "derivationPath";
        const { EIP712Domain, ...otherTypes } = message.types;

        const messageStruct = {
          domainSeparator: ethers.utils._TypedDataEncoder.hashDomain(message.domain),
          hashStruct: ethers.utils._TypedDataEncoder.hashStruct(
            message.primaryType,
            otherTypes,
            message.message,
          ),
        } as EIP712Params;

        // WHEN
        const result = await keyring.signMessage(derivationPath, messageStruct, {
          method: "eip712Hashed",
        });

        // THEN
        expect(mockAppBinding.signEIP712HashedMessage).toHaveBeenCalledWith(
          derivationPath,
          "6137beb405d9ff777172aa879e33edb34a1460e701802746c5ef96e741710e59",
          "90418913cbd47e54cfb74964f7c7905cc502076a3d59974cfc2d79a16261df09",
        );
        expect(result).toEqual({ r: "", s: "", v: 42 });
      });
    });
  });

  describe("getAddress calls", () => {
    it("should call app binding getAddress", async () => {
      // GIVEN
      const derivationPath = "derivationPath";

      // WHEN
      const result = await keyring.getAddress(derivationPath);

      // THEN
      expect(mockAppBinding.getAddress).toHaveBeenCalledWith(
        derivationPath,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual({ publicKey: "0x000", address: "0x000" });
    });

    it("should call app binding getAddress with options", async () => {
      // GIVEN
      const derivationPath = "derivationPath";
      const options = {
        displayOnDevice: true,
        chainId: "1",
      };

      // WHEN
      const result = await keyring.getAddress(derivationPath, options);

      // THEN
      expect(mockAppBinding.getAddress).toHaveBeenCalledWith(derivationPath, true, undefined, "1");
      expect(result).toEqual({ publicKey: "0x000", address: "0x000" });
    });

    it("should throw an error if the address is not valid", async () => {
      // GIVEN
      const derivationPath = "derivationPath";
      jest
        .spyOn(mockAppBinding, "getAddress")
        .mockResolvedValue({ publicKey: "0x000", address: "000" });

      // WHEN
      const promise = keyring.getAddress(derivationPath);

      // THEN
      expect(promise).rejects.toThrow(
        new Error("[DefaultKeyringEth] getAddress: Invalid address or public key"),
      );
    });
  });
});

import Solana from "@ledgerhq/hw-app-solana";
import { LegacySignerSolana } from "../src/LegacySignerSolana";
import { PubKeyDisplayMode } from "@ledgerhq/coin-solana/signer";
import * as loadPKIModule from "@ledgerhq/hw-bolos";
import {
  LatestFirmwareVersionRequired,
  TransportStatusError,
  UpdateYourApp,
} from "@ledgerhq/errors";
import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";

const signer = new LegacySignerSolana({ decorateAppAPIMethods: () => {} } as any);

describe("LegacySignerSolana", () => {
  describe("getAppConfiguration", () => {
    it("gets the app configuration", async () => {
      const getAppConfiguration = jest
        .spyOn(Solana.prototype, "getAppConfiguration")
        .mockResolvedValue({
          blindSigningEnabled: false,
          pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
          version: "1.8.2",
        });

      expect(await signer.getAppConfiguration()).toEqual({
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
        version: "1.8.2",
      });
      expect(getAppConfiguration).toHaveBeenCalledWith();
    });
  });

  describe("getAddress", () => {
    it.each([
      ["with display", true],
      ["without display", false],
    ])("gets an address %s", async (_, display) => {
      const getAddress = jest
        .spyOn(Solana.prototype, "getAddress")
        .mockResolvedValue({ address: Buffer.from("0102", "hex") });

      expect(await signer.getAddress("path", display)).toEqual({
        address: Buffer.from("0102", "hex"),
      });
      expect(getAddress).toHaveBeenCalledWith("path", display);
    });
  });

  describe("signTransaction", () => {
    it("signs a transaction without resolution", async () => {
      const signTransaction = jest.spyOn(Solana.prototype, "signTransaction").mockResolvedValue({
        signature: Buffer.from("0102", "hex"),
      });

      expect(await signer.signTransaction("path", Buffer.from("transaction"))).toEqual({
        signature: Buffer.from("0102", "hex"),
      });
      expect(signTransaction).toHaveBeenCalledWith("path", Buffer.from("transaction"));
    });

    it("fails to sign a transaction with a resolution and missing device model id", async () => {
      await expect(signer.signTransaction("path", Buffer.from("transaction"), {})).rejects.toThrow(
        "Resolution provided without a deviceModelId",
      );
    });

    it("fails to sign a transaction with a resolution and unsupported PKI", async () => {
      jest.spyOn(calService, "getCertificate").mockResolvedValue({ descriptor: "", signature: "" });
      jest.spyOn(loadPKIModule, "loadPKI").mockRejectedValue(new TransportStatusError(0x6a81));

      await expect(
        signer.signTransaction("path", Buffer.from("transaction"), {
          deviceModelId: DeviceModelId.europa,
        }),
      ).rejects.toThrow(new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired"));
    });

    it("fails to sign a transaction with a resolution and outdated firmware app", async () => {
      jest.spyOn(calService, "getCertificate").mockResolvedValue({ descriptor: "", signature: "" });
      jest.spyOn(loadPKIModule, "loadPKI").mockResolvedValue(undefined);
      jest.spyOn(Solana.prototype, "getAppConfiguration").mockResolvedValue({
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
        version: "1.6.2",
      });

      await expect(
        signer.signTransaction("path", Buffer.from("transaction"), {
          deviceModelId: DeviceModelId.europa,
          tokenAddress: "tokenAddress",
        }),
      ).rejects.toThrow(new UpdateYourApp());
      await expect(
        signer.signTransaction("path", Buffer.from("transaction"), {
          deviceModelId: DeviceModelId.europa,
          createATA: { address: "address", mintAddress: "mintAddress" },
        }),
      ).rejects.toThrow(new UpdateYourApp());
    });

    it("signs a transaction with a resolution and a 'tokenAddress' property", async () => {
      const getCertificate = jest.spyOn(calService, "getCertificate").mockResolvedValue({
        descriptor: "certificateDescriptor",
        signature: "certificateSignature",
      });
      const loadPKI = jest.spyOn(loadPKIModule, "loadPKI").mockResolvedValue(undefined);
      jest.spyOn(Solana.prototype, "getAppConfiguration").mockResolvedValue({
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
        version: "1.8.2",
      });
      jest.spyOn(Solana.prototype, "getChallenge").mockResolvedValue("challenge");
      const getOwnerAddress = jest.spyOn(trustService, "getOwnerAddress").mockResolvedValue({
        signedDescriptor: "signedDescriptor",
        tokenAccount: "",
        contract: "",
        owner: "",
      });
      const provideTrustedName = jest
        .spyOn(Solana.prototype, "provideTrustedName")
        .mockResolvedValue(true);
      const signTransaction = jest.spyOn(Solana.prototype, "signTransaction").mockResolvedValue({
        signature: Buffer.from("0102", "hex"),
      });

      expect(
        await signer.signTransaction("path", Buffer.from("transaction"), {
          deviceModelId: DeviceModelId.europa,
          tokenAddress: "tokenAddress",
        }),
      ).toEqual({
        signature: Buffer.from("0102", "hex"),
      });
      expect(getCertificate).toHaveBeenCalledWith(DeviceModelId.europa);
      expect(loadPKI).toHaveBeenCalledWith(
        expect.anything(),
        "TRUSTED_NAME",
        "certificateDescriptor",
        "certificateSignature",
      );
      expect(getOwnerAddress).toHaveBeenCalledWith("tokenAddress", "challenge");
      expect(provideTrustedName).toHaveBeenCalledWith("signedDescriptor");
      expect(signTransaction).toHaveBeenCalledWith("path", Buffer.from("transaction"));
    });

    it("signs a transaction with a resolution and a 'createATA' property", async () => {
      const getCertificate = jest.spyOn(calService, "getCertificate").mockResolvedValue({
        descriptor: "certificateDescriptor",
        signature: "certificateSignature",
      });
      const loadPKI = jest.spyOn(loadPKIModule, "loadPKI").mockResolvedValue(undefined);
      jest.spyOn(Solana.prototype, "getAppConfiguration").mockResolvedValue({
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
        version: "1.8.2",
      });
      jest.spyOn(Solana.prototype, "getChallenge").mockResolvedValue("challenge");
      const computedTokenAddress = jest
        .spyOn(trustService, "computedTokenAddress")
        .mockResolvedValue({
          signedDescriptor: "signedDescriptor",
          tokenAccount: "",
          contract: "",
          owner: "",
        });
      const provideTrustedName = jest
        .spyOn(Solana.prototype, "provideTrustedName")
        .mockResolvedValue(true);
      const signTransaction = jest.spyOn(Solana.prototype, "signTransaction").mockResolvedValue({
        signature: Buffer.from("0102", "hex"),
      });

      expect(
        await signer.signTransaction("path", Buffer.from("transaction"), {
          deviceModelId: DeviceModelId.europa,
          createATA: {
            address: "address",
            mintAddress: "mintAddress",
          },
        }),
      ).toEqual({
        signature: Buffer.from("0102", "hex"),
      });
      expect(getCertificate).toHaveBeenCalledWith(DeviceModelId.europa);
      expect(loadPKI).toHaveBeenCalledWith(
        expect.anything(),
        "TRUSTED_NAME",
        "certificateDescriptor",
        "certificateSignature",
      );
      expect(computedTokenAddress).toHaveBeenCalledWith("address", "mintAddress", "challenge");
      expect(provideTrustedName).toHaveBeenCalledWith("signedDescriptor");
      expect(signTransaction).toHaveBeenCalledWith("path", Buffer.from("transaction"));
    });
  });

  describe("signMessage", () => {
    it("signs a message", async () => {
      const signOffChainMessage = jest
        .spyOn(Solana.prototype, "signOffchainMessage")
        .mockResolvedValue({
          signature: Buffer.from("0102", "hex"),
        });

      expect(await signer.signMessage("path", "cafe")).toEqual({
        signature: Buffer.from("0102", "hex"),
      });
      expect(signOffChainMessage).toHaveBeenCalledWith("path", Buffer.from("cafe", "hex"));
    });
  });
});

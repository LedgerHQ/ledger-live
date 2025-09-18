import { LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import Transport from "@ledgerhq/hw-transport";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { PubKeyDisplayMode } from "@ledgerhq/coin-solana/signer";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { messageSigner } from "./setup";
import { solanaConfig } from "./config";
import bs58 from "bs58";

const SIGNATURE =
  "97fb71bae8971e272b17a464dc2f76995de2da9fc5d40e369edc43b0c3f7c601c4e5a60bb7c6ac69671120c381ce5cab7a06f53eb802e3ac555066455f2cbd05";
const BASE58_SIGNATURE =
  "43EtUq3x4vxxSZ2UyNxJXopCmF78UJFPySv5kRjQRX2PVuMBLQCPTRjJgPWKgN7fJXVoKZRAvU6W3T6ajJu3sce8";
const BASE58_ENVELOPE =
  "2MZJAqnJPmTqcnhFkR34XCbfRaZTT5dqAyQmFc37dS22cYn4HS81nBgYQDa199idtBWvvwCVa8yvn6rqkjtMS3WDWods2HabwZnv1TUABUbvVkjwh2T9vD1KYzBe3mim9Dk2jCHPuG1mKN8pdV2Sh8A8vjXaxwUNg714SMK4x2wg5Ww3Fb72MDXi9jgvXmt6FpehJZVfgFLFnUtr5YBW5xiBPQYFN6aHjzHwHcecmXCGLavvK4DVoUjufLinrXiMYUdEGqnSjzwTHRF6mjUVcP3nC";

const APP_VERSION = "1.8.2";
const getAppConfigurationMock = jest.fn(() => {
  return Promise.resolve({
    version: APP_VERSION,
    blindSigningEnabled: false,
    pubKeyDisplayMode: PubKeyDisplayMode.LONG,
  });
});

const signOffchainMessageMock = jest.fn(() =>
  Promise.resolve({
    signature: Buffer.from(SIGNATURE, "hex"),
  }),
);

jest.mock("@ledgerhq/live-signer-solana", () => {
  return {
    LegacySignerSolana: jest.fn().mockImplementation(() => {
      return {
        signMessage: signOffchainMessageMock,
        getAppConfiguration: getAppConfigurationMock,
      };
    }),
  };
});

LiveConfig.setConfig(solanaConfig);

describe("Testing setup on Solana", () => {
  describe("Testing message signer", () => {
    it("should call the underlying signer for off-chain message signature", async () => {
      const freshAddressPath = "44'/60'/0'/0/0";
      const freshAddress = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";
      const message = "4c6f6e67204f66662d436861696e2054657374204d6573736167652e";
      const result = await messageSigner.signMessage(
        {} as Transport,
        { freshAddressPath: freshAddressPath, freshAddress } as Account,
        { message: message } as AnyMessage,
      );

      expect(LegacySignerSolana).toHaveBeenCalledTimes(1);
      expect(signOffchainMessageMock).toHaveBeenCalledTimes(1);

      const args = signOffchainMessageMock.mock.calls[0] as unknown[];
      expect(args[0]).toEqual(freshAddressPath);

      expect((args[1] as Buffer).toString("hex")).toEqual(
        "ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be0323538003463366636653637323034663636363632643433363836313639366532303534363537333734323034643635373337333631363736353265",
      );

      expect(result.signature).toEqual(BASE58_ENVELOPE);
      expect(bs58.encode(bs58.decode(result.signature).subarray(1, 65))).toEqual(BASE58_SIGNATURE);
      expect(result.rsv).toBeUndefined();
    });
  });
});

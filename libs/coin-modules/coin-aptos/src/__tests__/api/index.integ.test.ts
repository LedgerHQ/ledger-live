import {
  Aptos,
  AptosConfig,
  type AptosSettings,
  Hex,
  Network,
  SimpleTransaction,
  DEFAULT_MAX_GAS_AMOUNT,
  AccountAddress,
  Ed25519PrivateKey,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";
import buildTransaction from "../../bridge/buildTransaction";
import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import { AptosAPI } from "../../network";
import { DEFAULT_GAS_PRICE } from "../../bridge/logic";

describe("createApi", () => {
  const settings: AptosSettings = { network: Network.DEVNET };
  const api = createApi({ aptosSettings: settings });

  let aptos: Aptos;

  const senderAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";
  const senderPrivateKey = PrivateKey.formatPrivateKey(
    "0x3ae49ec6ad15de36cb1c9abd650fdf37d9a77d025b64698a66ffef951c26973e",
    PrivateKeyVariants.Ed25519,
  );
  const senderPublicKey = "0x15fe412bffbfe659a2fd61001f1c4c264f5c53f11c1706cd0d3a89e9a9d1e1e3";
  const senderPK = new Ed25519PrivateKey(senderPrivateKey);

  const receiverAddress = "0x7abe80aaf3e38f236597d81c596dc7b31abb23cff69d62c230ed106580750038";

  beforeAll(async () => {
    const config = new AptosConfig(settings);
    aptos = new Aptos(config);

    await aptos.fundAccount({
      accountAddress: AccountAddress.fromString(senderAddress),
      amount: 100_000_000,
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock).toHaveProperty("hash");
      expect(Hex.isValid(lastBlock.hash ?? "").valid).toBeTruthy();
      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock).toHaveProperty("time");
      expect(lastBlock.time).not.toBe(new Date("1970-01-01"));
    });
  });

  describe("combine and broadcast", () => {
    it("sign and submit the transaction using combine and broadcast", async () => {
      // arrange

      // TODO: should be replaced by the craftTransaction method
      const aptosApi = new AptosAPI(settings);
      const transaction = createFixtureTransaction();
      transaction.recipient = receiverAddress;
      transaction.amount = BigNumber(10);
      transaction.options.gasUnitPrice = DEFAULT_GAS_PRICE.toString();
      transaction.options.maxGasAmount = DEFAULT_MAX_GAS_AMOUNT.toString();

      const senderAccount = createFixtureAccount({
        freshAddress: senderAddress,
      });
      const tx = await buildTransaction(senderAccount, transaction, aptosApi);

      // generating signature
      const signingMessage = aptos.getSigningMessage({ transaction: new SimpleTransaction(tx) });
      const signature = senderPK.sign(signingMessage);

      // act
      const signedTx = api.combine(tx.bcsToHex().toString(), signature.toString(), senderPublicKey);

      const hash = await api.broadcast(signedTx);

      // asset
      expect(() => Hex.isValid(signedTx).valid).toBeTruthy();
      expect(hash).toEqual(expect.any(String));
    });
  });
});

import {
  Account as sdkAccount,
  Aptos,
  AptosConfig,
  type AptosSettings,
  Hex,
  Network,
  type Ed25519Account,
  SimpleTransaction,
  DEFAULT_MAX_GAS_AMOUNT,
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
  let sender: Ed25519Account;
  let receiver: sdkAccount;

  beforeAll(async () => {
    // TODO: use fixed addresses for sender and receiver
    sender = sdkAccount.generate();
    receiver = sdkAccount.generate();

    const config = new AptosConfig(settings);
    aptos = new Aptos(config);
    await aptos.fundAccount({
      accountAddress: sender.accountAddress,
      amount: 100_000_000,
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock).toHaveProperty("hash");
      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock).toHaveProperty("time");
    });
  });

  describe("combine and broadcast", () => {
    it("sign and submit the transaction using combine and broadcast", async () => {
      // TODO: should be replaced by the craftTransaction method
      const aptosApi = new AptosAPI(settings);
      const transaction = createFixtureTransaction();
      transaction.recipient = receiver.accountAddress.toString();
      transaction.amount = BigNumber(10);
      transaction.options.gasUnitPrice = DEFAULT_GAS_PRICE.toString();
      transaction.options.maxGasAmount = DEFAULT_MAX_GAS_AMOUNT.toString();

      const senderAccount = createFixtureAccount({
        freshAddress: sender.accountAddress.toString(),
      });
      const tx = await buildTransaction(senderAccount, transaction, aptosApi);

      const signingMessage = aptos.getSigningMessage({ transaction: new SimpleTransaction(tx) });
      const signature = sender.privateKey.sign(signingMessage);

      const signedTx = api.combine(
        tx.bcsToHex().toString(),
        signature.toString(),
        sender.publicKey.toString(),
      );

      const hash = await api.broadcast(signedTx);

      expect(() => Hex.isValid(signedTx).valid).toBeTruthy();
      expect(hash).toEqual(expect.any(String));
    });
  });
});

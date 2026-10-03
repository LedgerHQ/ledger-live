import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  generateSignedTransaction,
  SimpleTransaction,
  Hex,
} from "@aptos-labs/ts-sdk";
import { AptosAPI } from "./client";

describe("richItemByVersion", () => {
  const client = new AptosAPI("aptos");

  it.each([
    ["genesis", 0],
    ["block metadata of block 1000000", 2031210],
    ["state checkpoint of block 1000000", 2031211],
  ])("returns null for the payload-less %s transaction", async (_, version) => {
    await expect(client["richItemByVersion"](version)).resolves.toBeNull();
  });

  it("returns a user transaction with its block", async () => {
    const tx = await client["richItemByVersion"](7422723293);

    expect(tx).toMatchObject({
      type: "user_transaction",
      sender: "0x201cf09644cd5d88aa6db2d1670011325eea2c3198ddfd0c1aa549be0003bb24",
      payload: { type: "entry_function_payload" },
      block: { height: expect.any(Number), hash: expect.any(String) },
    });
  });
});

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const client = new AptosAPI("aptos");
    const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));
    const sender = Account.generate();
    const { sequence_number } = await aptos.getAccountInfo({
      accountAddress: sender.accountAddress,
    });
    const tx = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [sender.accountAddress, 1],
      },
      options: {
        accountSequenceNumber: BigInt(sequence_number),
      },
    });
    const txRaw = tx.rawTransaction;
    const signed = aptos.transaction.sign({
      signer: sender,
      transaction: tx,
    });
    const combined = generateSignedTransaction({
      transaction: { rawTransaction: txRaw } as SimpleTransaction,
      senderAuthenticator: signed,
    });
    const hex = Hex.fromHexInput(combined).toString();
    await expect(client.broadcast(hex)).rejects.toThrow(/INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE/);
  });
});

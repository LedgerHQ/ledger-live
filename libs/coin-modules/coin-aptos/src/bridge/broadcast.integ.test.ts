import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Hex,
  generateSignedTransaction,
  SimpleTransaction,
} from "@aptos-labs/ts-sdk";
import broadcast from "./broadcast";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
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

    await expect(
      broadcast({
        signedOperation: { signature: hex },
        account: { currency: { id: "aptos" } },
      } as any),
    ).rejects.toThrow(/INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE/);
  });
});

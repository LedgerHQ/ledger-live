import * as bitcoin from "bitcoinjs-lib";
import { BitcoinAccount, Transaction } from "./types";
import { Buffer } from "buffer";
import { buildTransaction } from "./buildTransaction";

// Function to compute Bitcoin transaction hash based on the built transaction
export const getTransactionHash = async ({
  transaction,
  account,
}: {
  transaction: Transaction;
  account: BitcoinAccount;
}): Promise<string> => {
  const builtTx = await buildTransaction(account, transaction);

  // Create a new Bitcoin Transaction object using the inputs and outputs from the built transaction
  const bitcoinTx = new bitcoin.Transaction();

  // Add inputs to the Bitcoin transaction
  builtTx.inputs.forEach(input => {
    const txHashBuffer = Buffer.from(Buffer.from(input.output_hash, "hex").reverse()); // Convert the hash into a buffer and reverse it
    bitcoinTx.addInput(txHashBuffer, input.output_index, input.sequence);
  });

  // Add outputs to the Bitcoin transaction
  builtTx.outputs.forEach(output => {
    if (output.address) {
      // Regular transaction with an address
      bitcoinTx.addOutput(bitcoin.address.toOutputScript(output.address), output.value.toNumber());
    } else {
      // OP_RETURN transaction (address is null, so we create the script from the OP_RETURN data)
      bitcoinTx.addOutput(output.script, output.value.toNumber());
    }
  });

  // Serialize and compute the transaction ID (hash)
  const txHex = bitcoinTx.toHex(); // Serialize to hex
  const txHash = Buffer.from(bitcoin.crypto.hash256(Buffer.from(txHex, "hex"))).reverse();
  return Buffer.from(txHash).toString("hex");
};

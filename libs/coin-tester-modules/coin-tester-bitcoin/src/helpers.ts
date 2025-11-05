import Client from "bitcoin-core";

// fetched from bitcoin.conf
const client: any = new Client({
  version: "0.24.1",
  username: "user",
  password: "pass",
  host: "http://localhost:18443",
});

export async function loadWallet(name: string): Promise<void> {
  try {
    // Try creating and loading the wallet
    const res = await client.command("createwallet", name);
    console.log(`✅ Wallet "${name}" created and loaded:`, res);

    // Optionally verify that the wallet is accessible
    await client.getBalance({ minconf: 0 });
    return;
  } catch (error: any) {
    const message = error?.message || "Unknown error";

    // Wallet already exists → try loading it
    if (message.includes("already exists")) {
      console.log(`ℹ️ Wallet "${name}" already exists. Attempting to load...`);
      return loadExistingWallet(name);
    }

    console.error(`❌ Failed to create wallet "${name}":`, message);
  }
}

/**
 * Attempt to load an existing wallet, handling "already loaded" gracefully.
 */
async function loadExistingWallet(name: string): Promise<void> {
  try {
    await client.command("loadwallet", name);
    console.log(`✅ Wallet "${name}" loaded successfully.`);
  } catch (error: any) {
    const message = error?.message || "Unknown error";

    if (message.includes("already loaded")) {
      console.log(`ℹ️ Wallet "${name}" is already loaded.`);
    } else {
      console.error(`❌ Failed to load existing wallet "${name}":`, message);
    }
  }
}

export async function mineToWalletAddress(param: string) {
  const address = await client.getNewAddress();
  const nbBlocks = parseInt(param);
  await client.generateToAddress({
    nblocks: nbBlocks,
    address,
  });
  console.log(`Mined ${nbBlocks} blocks to: ${address}`);
}
const FEES = 0.0001;

export const mineBlock = async (address: string) => {
  await client.generateToAddress({
    nblocks: 1,
    address,
  });
};

export const getCurrentBlock = async () => {
  return await client.command("getblockcount");
};

/*
 * Note that it sets the input sequence to 4294967293, <=0xFFFFFFFD — Replace By Fee (RBF).
 */
export const sendTo = async (recipientAddress: string, amount: number) => {
  await client.getBalance({ minconf: 0 });
  if (!recipientAddress || amount <= 0) {
    console.error("Invalid parameters: Provide a valid recipient address and positive amount.");
    return;
  }

  console.log(`Sending ${amount} BTC to ${recipientAddress}...`);

  try {
    // Step 1: Send the specified amount to the recipient address
    const txSendToAddress = await client
      .sendToAddress({
        address: recipientAddress,
        amount: amount,
      })
      .then((txid: string) => txid);

    // Step 2: Fetch transaction details
    await client.getTransaction({
      txid: txSendToAddress,
      verbose: true,
    });

    // Step 4: Fetch updated transaction details after confirmation
    await client.getTransaction({
      txid: txSendToAddress,
      verbose: true,
    });
  } catch (error: any) {
    console.error("Error in sendToAddress:", error.message);
  }
};
export const sendToMany = async (recipientAddress: string, amount: number, times: number) => {
  // calls sendTo times times
  for (let i = 0; i < times; i++) {
    await sendTo(recipientAddress, amount);
  }
};

export const sendAutomatedRaw = async (destinationAddress: string, amount: number) => {
  if (!destinationAddress || amount <= 0) {
    console.error("Invalid parameters: Provide a valid address and positive amount.");
    return;
  }

  try {
    // Step 1: Create an unfinished raw transaction (no inputs, outputs only)
    const unfinishedTx = await client.createRawTransaction({
      inputs: [],
      outputs: {
        [destinationAddress]: amount,
      },
    });

    // Step 2: Fund the transaction (Bitcoin Core automatically selects UTXOs)
    const fundedTx = await client.fundRawTransaction({
      hexstring: unfinishedTx,
      options: { replaceable: true }, // Set to true if RBF is needed
      // if replaceable: false, sequence of vin set to 4294967294 (0xFFFFFFFE) // Locktime BUT non-rbf
      // else, sets to: 4294967293 // Locktime & RBF
    });

    // Step 3: Decode the transaction for debugging
    await client.decodeRawTransaction({
      hexstring: fundedTx.hex,
    });

    // Step 4: Sign the transaction
    const signedTxHex = await client.signRawTransactionWithWallet({
      hexstring: fundedTx.hex,
    });

    // Step 5: Broadcast the transaction to the network
    const transactionId = await client.sendRawTransaction({
      hexstring: signedTxHex.hex,
    });

    console.log(`Transaction Broadcasted! TXID: ${transactionId}`);
  } catch (error: any) {
    console.error("Error sending transaction:", error.message);
  }
};

/*
 * https://learnmeabitcoin.com/technical/transaction/input/sequence/
 * NOTE: You only need to set one of the sequence fields to enable locktime or RBF
 * (even if you have multiple inputs and sequence fields in one transaction)
 * However, relative locktime settings are specific to each input.
 *
 * If set to 0xFFFFFFFE (4294967294) → Locktime / Non-RBF
 *  If set to a number ≤ 0x0000FFFF (65535) → Blocks-based timelock.
 *  Sequence	Effect
 *  0xFFFFFFFE (4294967294)	Default (Non-RBF): Cannot be replaced
 * 0xFFFFFFFD (4294967293)	Opt-in RBF: Can be replaced by a higher fee transaction
 *
 *
 * Called like this as you've got more control over all the inputs
 */
export const sendRaw = async (recipientAddress: string, amount: number, sequence = 4294967294) => {
  if (!recipientAddress || amount <= 0) {
    console.error("Invalid parameters: Provide a valid address and positive amount.");
    return;
  }

  console.log(
    `Creating raw transaction: Sending ${amount} BTC to ${recipientAddress} with sequence=${sequence}...`,
  );

  try {
    // Step 2: Get new addresses
    const newAddress = await client.getNewAddress({ address_type: "legacy" });
    const changeAddress = await client.getRawChangeAddress({
      address_type: "legacy",
    });

    // Step 3: Get UTXO for spending
    const unspents = await client.listUnspent({});
    let id = 0;
    let unspent = unspents[id];

    while (unspent.amount < amount) {
      console.warn("Insufficient funds. Picking another UTXO.");
      id++;
      unspent = unspents[id];
    }

    // Step 4: Calculate change
    const changeAmountStr = Number(unspent.amount - amount - FEES).toFixed(6);
    const changeAmount = Number(changeAmountStr);

    if (changeAmount < 0) {
      console.warn("Insufficient funds after fees.");
      return;
    }

    // Step 5: Create raw transaction
    const rawTxHex = await client.createRawTransaction({
      inputs: [
        {
          txid: unspent.txid,
          vout: unspent.vout,
          sequence: sequence,
        },
      ],
      outputs: {
        [recipientAddress]: amount,
        [changeAddress]: changeAmount,
      },
    });

    await client.decodeRawTransaction({
      hexstring: rawTxHex,
    });

    // Step 6: Sign the transaction
    const signedTxHex = await client.signRawTransactionWithWallet({
      hexstring: rawTxHex,
    });

    // Step 7: Broadcast the transaction
    const txId = await client.sendRawTransaction({
      hexstring: signedTxHex.hex,
    });

    // Step 8: Fetch transaction details
    await client.getTransaction({ txid: txId, verbose: true });

    // Step 9: Mine a block to confirm the transaction
    await mineBlock(newAddress);
  } catch (error: any) {
    console.error("Error in sendRaw:", error.message);
    console.error({ error });
  }
};

export const sendToReplaceCurrentTx = async (recipientAddress: string, amount: number) => {
  if (!recipientAddress || amount <= 0) {
    console.error("Invalid parameters: Provide a valid address and positive amount.");
    return;
  }

  console.log(
    `Sending replaceable transaction to ${recipientAddress} with amount ${amount} BTC...`,
  );

  try {
    // Step 1: Get an unspent UTXO
    const unspent = await client.listUnspent({
      query_options: { minimumSumAmount: amount },
    });

    if (!unspent.length) {
      console.error("No suitable UTXOs available.");
      return;
    }

    const utxo = unspent[0];

    // Step 2: Create the replaceable transaction (RBF enabled)
    const rawTx1 = await client.createRawTransaction({
      inputs: [
        {
          txid: utxo.txid,
          vout: utxo.vout,
          sequence: 4294967293, // RBF enabled
        },
      ],
      outputs: {
        [recipientAddress]: amount,
      },
    });

    // Step 3: Fund & Sign the transaction
    const fundedTx1 = await client.fundRawTransaction({
      hexstring: rawTx1,
      options: { feeRate: 0.0004 }, // Increase fee rate
    });
    const signedTx1 = await client.signRawTransactionWithWallet({
      hexstring: fundedTx1.hex,
    });

    // Step 4: Broadcast the transaction
    const txId1 = await client.sendRawTransaction({ hexstring: signedTx1.hex });
    console.log(`Transaction sent (TXID: ${txId1}), waiting before replacing...`);
    console.log(`If you need to, make a tx that sends funds to ${recipientAddress}`);
  } catch (error: any) {
    console.error("Error in sendReplaceableTransaction:", error.message);
  }
};

export const sendReplaceableTransaction = async (recipientAddress: string, amount: number) => {
  if (!recipientAddress || amount <= 0) {
    console.error("Invalid parameters: Provide a valid address and positive amount.");
    return;
  }

  console.log(
    `Sending replaceable transaction to ${recipientAddress} with amount ${amount} BTC...`,
  );

  try {
    // Step 1: Get an unspent UTXO
    const unspent = await client.listUnspent({
      query_options: { minimumSumAmount: amount },
    });

    if (!unspent.length) {
      console.error("No suitable UTXOs available.");
      return;
    }

    const utxo = unspent[0];

    // Step 2: Create the first replaceable transaction (RBF enabled)
    const rawTx1 = await client.createRawTransaction({
      inputs: [
        {
          txid: utxo.txid,
          vout: utxo.vout,
          sequence: 4294967293, // RBF enabled
        },
      ],
      outputs: {
        [recipientAddress]: amount,
      },
    });

    // Step 3: Fund & Sign the first transaction
    const fundedTx1 = await client.fundRawTransaction({
      hexstring: rawTx1,
      options: { feeRate: 0.0002 }, // Increase fee rate
    });
    const signedTx1 = await client.signRawTransactionWithWallet({
      hexstring: fundedTx1.hex,
    });

    // Step 4: Broadcast the first transaction
    const txId1 = await client.sendRawTransaction({ hexstring: signedTx1.hex });
    console.log(`First transaction sent (TXID: ${txId1}), waiting before replacing...`);
  } catch (error: any) {
    console.error("Error in sendReplaceableTransaction:", error.message);
  }
};

/*Available commands:
  mineBlock <address>                            - Mine a block to the address
  sendTo <address> <amount>                   - Send a transaction to an address
  sendToMany <address> <amount> <times>       - Send a transaction to an address
  replaceTx <address> <amount>                - Send a transaction and replace it using RBF
  sendAutomatedRaw <address> <amount>         - Send a raw transaction, automatically funded
  sendRaw <address> <amount> [sequence]       - Send a raw transaction with a custom sequence
  sendRawTwoOutputs <address1> <address2> <amount> [sequence] - Send a raw transaction with a custom sequence to 2 addresses
  # doubleSpend <address>                       - Attempt a double-spend attack
  # dustTransaction <address>                   - Create a dust transaction
  # multisig <address>                          - Test a multisig transaction`;
*/

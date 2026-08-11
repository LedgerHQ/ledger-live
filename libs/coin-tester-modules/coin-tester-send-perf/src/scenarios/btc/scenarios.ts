import Client from "bitcoin-core";
import { SendPerfFixture } from "../../engine/fixtureTypes";
import {
  broadcastRawExpectReject,
  createBtcClient,
  ensureWallet,
  fundWallet,
} from "../../engine/btcRegtest";

export type BtcScenario = {
  fixture: SendPerfFixture;
  run: (client: Client) => Promise<void>;
};

const FEE = 0.0001;
const SEND_AMOUNT = 0.01;

async function pickUnspent(client: Client, minAmount = 0.02) {
  const unspents = await client.listUnspent({ minimumAmount: minAmount });
  const unspent = unspents[0];
  if (!unspent) {
    throw new Error(`no UTXO >= ${minAmount} BTC available`);
  }
  return unspent as { txid: string; vout: number; amount: number };
}

async function buildAndSignRawSpend(
  client: Client,
  unspent: { txid: string; vout: number; amount: number },
  recipient: string,
  sequence = 0xfffffffd,
): Promise<string> {
  const changeAddress = await client.getRawChangeAddress({ address_type: "bech32" });
  const changeAmount = Number((unspent.amount - SEND_AMOUNT - FEE).toFixed(8));
  if (changeAmount <= 0) {
    throw new Error("UTXO too small for requested send amount");
  }

  const raw = await client.createRawTransaction({
    inputs: [{ txid: unspent.txid, vout: unspent.vout, sequence }],
    outputs: {
      [recipient]: SEND_AMOUNT,
      [changeAddress]: changeAmount,
    },
  });

  const signed = await client.signRawTransactionWithWallet({ hexstring: raw });
  if (!signed.complete) {
    throw new Error("failed to sign BTC raw transaction");
  }

  return signed.hex;
}

export const BTC_LAYER1_SCENARIOS: BtcScenario[] = [
  {
    fixture: {
      id: "btc-missingorspent-stale-utxo",
      chain: "bitcoin",
      layer: 1,
      description: "Broadcast a tx that spends an already-confirmed UTXO",
      expectReject: "bad-txns-inputs-missingorspent",
      productionWeight: {
        source: "Errors/BTC.md",
        note: "Rare from clients; server-side dominated",
      },
    },
    run: async client => {
      const unspent = await pickUnspent(client);
      const firstRecipient = await client.getNewAddress();
      const staleRecipient = await client.getNewAddress();

      const confirmedHex = await buildAndSignRawSpend(client, unspent, firstRecipient);
      const staleHex = await buildAndSignRawSpend(client, unspent, staleRecipient);

      await client.sendRawTransaction({ hexstring: confirmedHex });
      await client.generateToAddress({
        nblocks: 1,
        address: await client.getNewAddress(),
      });

      await broadcastRawExpectReject(client, staleHex, "bad-txns-inputs-missingorspent", [
        "missingorspent",
        "already in block chain",
      ]);
    },
  },
  {
    fixture: {
      id: "btc-txn-mempool-conflict",
      chain: "bitcoin",
      layer: 1,
      description: "Two conflicting txs spend the same UTXO while the first is still in mempool",
      expectReject: "txn-mempool-conflict",
      productionWeight: {
        source: "Errors/BTC.md",
        count_14d: 89,
        note: "TxReplacementError / double-spend race",
      },
    },
    run: async client => {
      const unspent = await pickUnspent(client);
      const recipientA = await client.getNewAddress();
      const recipientB = await client.getNewAddress();

      const txA = await buildAndSignRawSpend(client, unspent, recipientA);
      await client.sendRawTransaction({ hexstring: txA });

      const txB = await buildAndSignRawSpend(client, unspent, recipientB);
      await broadcastRawExpectReject(client, txB, "txn-mempool-conflict", [
        "mempool-conflict",
        "rejecting replacement",
        "missingorspent",
      ]);
    },
  },
  {
    fixture: {
      id: "btc-rbf-underpriced-replacement",
      chain: "bitcoin",
      layer: 1,
      description: "RBF replacement with insufficient fee bump",
      expectReject: "insufficient fee",
      productionWeight: {
        source: "Errors/BTC.md",
        count_14d: 89,
        note: "RBF path; maps to TxReplacementError in production",
      },
    },
    run: async client => {
      const unspent = await pickUnspent(client);
      const recipient = await client.getNewAddress();
      const originalHex = await buildAndSignRawSpend(client, unspent, recipient);
      await client.sendRawTransaction({ hexstring: originalHex });

      const decoded = await client.decodeRawTransaction({ hexstring: originalHex });
      const input = decoded.vin[0];
      const replacementRecipient = await client.getNewAddress();
      const changeAddress = await client.getRawChangeAddress({ address_type: "bech32" });

      const replacementRaw = await client.createRawTransaction({
        inputs: [{ txid: input.txid, vout: input.vout, sequence: 0xfffffffd }],
        outputs: {
          [replacementRecipient]: SEND_AMOUNT,
          [changeAddress]: Number((unspent.amount - SEND_AMOUNT - FEE * 0.1).toFixed(8)),
        },
      });

      const signedReplacement = await client.signRawTransactionWithWallet({
        hexstring: replacementRaw,
      });

      await broadcastRawExpectReject(client, signedReplacement.hex, "insufficient fee", [
        "txn-mempool-conflict",
        "min relay fee not met",
        "rejecting replacement",
        "fee",
      ]);
    },
  },
];

export async function prepareBtcWallet(client: Client): Promise<void> {
  await ensureWallet(client);
  const info = await client.getBlockchainInfo();
  if (info.blocks < 100) {
    await fundWallet(client, 101);
  }
}

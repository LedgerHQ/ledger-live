import { BigNumber } from "bignumber.js";
import { isSegwitDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { address as btcAddress } from "bitcoinjs-lib";
import cashaddr from "cashaddrjs";
import { http, HttpResponse } from "msw";
import { signAccountTx } from "../../buildAndSign";
import { ESTIMATION_RECIPIENTS } from "../../constants";
import { getNetworkParameters } from "../../networks";
import { perCoinLogic } from "../../logic";
import type { BitcoinSigner, CreateTransaction } from "../../signer";
import { buildAdditionals } from "../../signOperation";

/** The bridge's derivation mode of an account ("", "segwit", "native_segwit", "taproot"). */
type DerivationMode = Parameters<typeof buildAdditionals>[1];
type SignParams = Parameters<typeof signAccountTx>[1];
import type { Transaction as BridgeTransaction } from "../../types";
import { craftTransaction } from "../../logic/craftTransaction";
import type { BitcoinIntent } from "../../logic/intent";
import { cryptoFor } from "../../logic/selectUtxos";
import { type DeviceSigningParameters, deviceSigningParameters } from "../../logic/signingRequest";
import { PRISTINE_P2PKH } from "../../logic/tests/helpers/fixtures";
import { ADDRESSES, PUBLIC_KEY, fundingTransaction } from "../../logic/tests/helpers/keys";
import {
  explorerUrl,
  feesHandler,
  networkHandler,
  pendingUtxosHandler,
  server,
  testContext,
  useMswServer,
  utxosHandler,
} from "../../logic/tests/helpers/msw";

useMswServer();

/**
 * Parity with the bridge: for the same inputs and outputs, the parameters a Ledger app gets to sign
 * what the coin module crafted are those the bridge passes to hw-app-btc's
 * `createPaymentTransaction` (`signOperation.ts` → `buildAndSign.ts` `signAccountTx`).
 */

type Case = {
  currencyId: string;
  explorerId: string;
  sender: string;
  recipient: string;
  /** The bridge's derivation mode of the sender. */
  derivationMode: DerivationMode;
  /** Formats the device builds (Komodo, Decred): any hex stands for a previous transaction. */
  opaquePreviousTxs?: boolean;
};

const CASES: Case[] = [
  ...(
    [
      ["legacy", ADDRESSES.legacy, ""],
      ["nested SegWit", ADDRESSES.segwit, "segwit"],
      ["native SegWit", ADDRESSES.nativeSegwit, "native_segwit"],
      ["Taproot", ADDRESSES.taproot, "taproot"],
    ] as const
  ).map(([, sender, derivationMode]) => ({
    currencyId: "bitcoin",
    explorerId: "btc",
    sender,
    recipient: PRISTINE_P2PKH,
    derivationMode: derivationMode as DerivationMode,
  })),
  ...(
    [
      ["bitcoin_cash", "bch"],
      ["bitcoin_gold", "btg"],
      ["dogecoin", "doge"],
      ["litecoin", "ltc"],
      ["dash", "dash"],
      ["qtum", "qtum"],
    ] as const
  ).map(([currencyId, explorerId]) => ({
    currencyId,
    explorerId,
    sender: ESTIMATION_RECIPIENTS[currencyId],
    recipient: ESTIMATION_RECIPIENTS[currencyId],
    derivationMode: "" as DerivationMode,
  })),
  {
    currencyId: "komodo",
    explorerId: "kmd",
    sender: "RNjJYvz6aCMaeZanXfCpXvoc2FKxEKMTj2",
    recipient: ESTIMATION_RECIPIENTS.komodo,
    derivationMode: "" as DerivationMode,
    opaquePreviousTxs: true,
  },
  {
    currencyId: "decred",
    explorerId: "dcr",
    sender: "DsVETTBzJSuzszSTiJLmrswY47GcCKCRu5E",
    recipient: ESTIMATION_RECIPIENTS.decred,
    derivationMode: "" as DerivationMode,
    opaquePreviousTxs: true,
  },
  {
    // A cashaddr recipient: the device gets the `cashaddr` flag (APDU p2 0x03).
    currencyId: "bitcoin_cash",
    explorerId: "bch",
    sender: ESTIMATION_RECIPIENTS.bitcoin_cash,
    recipient: cashaddr.encode(
      "bitcoincash",
      "P2PKH",
      new Uint8Array(btcAddress.fromBase58Check(ESTIMATION_RECIPIENTS.bitcoin_cash).hash),
    ),
    derivationMode: "" as DerivationMode,
  },
];

/** Serves two confirmed outputs of `sender` and their previous transactions. */
function fund(c: Case) {
  const script = cryptoFor(c.currencyId).toOutputScript(c.sender);
  const previous = [80_000_000, 30_000_000].map((value, salt) => {
    const tx = fundingTransaction(script, value, salt);
    return {
      txid: tx.getId(),
      value,
      hex: c.opaquePreviousTxs ? `0400008085202f89${String(salt).repeat(8)}` : tx.toHex(),
    };
  });
  server.use(
    feesHandler({ "2": 32_000, "4": 31_000, "6": 30_000 }, c.explorerId),
    networkHandler("0.0001", c.explorerId),
    utxosHandler(
      c.sender,
      [
        {
          data: previous.map(p => ({
            txId: p.txid,
            outputIndex: 0,
            value: String(p.value),
            hex: script.toString("hex"),
            height: 100,
          })),
          token: null,
        },
      ],
      c.explorerId,
    ),
    pendingUtxosHandler(c.sender, {}, c.explorerId),
    ...previous.map(p =>
      http.get(`${explorerUrl(c.explorerId)}/tx/${p.txid}/hex`, () =>
        HttpResponse.json({ hex: p.hex }),
      ),
    ),
  );
}

/** What the bridge passes to `createPaymentTransaction` for the same inputs and outputs. */
async function bridgeArguments(
  c: Case,
  ours: DeviceSigningParameters,
  outputs: { script: Buffer; value: bigint; isChange: boolean }[],
  opReturnData?: Buffer,
): Promise<CreateTransaction & { splits: unknown[] }> {
  // signOperation.ts: the device parameters of the bridge.
  const perCoin = perCoinLogic[c.currencyId];
  const transaction = { recipient: c.recipient, opReturnData } as unknown as BridgeTransaction;
  // buildTransaction.ts: bitcoin and its test networks send replaceable transactions.
  const rbf = ["bitcoin", "bitcoin_testnet", "bitcoin_regtest"].includes(c.currencyId);

  const captured: { arg?: CreateTransaction; splits: unknown[] } = { splits: [] };
  const btc = {
    splitTransaction: (
      hex: string,
      _segwit: boolean,
      hasExtraData: boolean,
      additionals: string[],
    ) => {
      captured.splits.push({ hex, hasExtraData, additionals });
      return hex;
    },
    createPaymentTransaction: async (arg: CreateTransaction) => {
      captured.arg = arg;
      return "signed";
    },
  } as unknown as BitcoinSigner;

  const txInfo = {
    inputs: ours.inputs.map(input => ({
      txHex: input.prevTxHex,
      output_index: input.vout,
      sequence: rbf ? 0 : 0xffffffff,
      block_height: 100,
    })),
    outputs: outputs.map(output => ({
      script: output.script,
      value: new BigNumber(output.value.toString()),
      isChange: output.isChange,
    })),
    associatedDerivations: ours.inputs.map(() => [0, 0]),
    changeAddress: { account: 1, index: 0 },
  } as unknown as SignParams["txInfo"];
  const fromAccount = {
    xpub: { currentBlockHeight: 100 },
    params: { path: "44'/0'", index: 0 },
  } as unknown as SignParams["fromAccount"];

  await signAccountTx(() => {}, {
    btc,
    fromAccount,
    txInfo,
    ...(perCoin?.hasInterestLockTime ? { lockTime: Math.floor(Date.now() / 1000) - 777 } : {}),
    sigHashType: getNetworkParameters(c.currencyId).sigHash,
    segwit: isSegwitDerivationMode(c.derivationMode as never),
    additionals: buildAdditionals(c.currencyId, c.derivationMode, transaction),
    ...(perCoin?.hasExpiryHeight ? { expiryHeight: Buffer.from([0, 0, 0, 0]) } : {}),
    hasExtraData: perCoin?.hasExtraData || false,
  });
  return { ...captured.arg!, splits: captured.splits };
}

describe.each(CASES)("deviceSigningParameters for $currencyId ($derivationMode)", c => {
  const context = testContext({ explorerId: c.explorerId });
  const intent = (overrides: Partial<BitcoinIntent> = {}): BitcoinIntent => ({
    intentType: "transaction",
    type: "send",
    sender: c.sender,
    recipient: c.recipient,
    amount: 50_000_000n,
    asset: { type: "native" },
    senderPublicKey: PUBLIC_KEY.toString("hex"),
    ...overrides,
  });

  it.each([
    ["a payment with change", {}],
    ["a payment with OP_RETURN data", { data: { type: "bitcoin", opReturnData: "73776170" } }],
  ] as const)("matches the bridge's arguments for %s", async (_label, overrides) => {
    fund(c);
    const crafted = await craftTransaction(context, c.currencyId, intent(overrides));
    // The recipient as entered: Bitcoin Cash's `cashaddr` device flag depends on its format.
    const ours = deviceSigningParameters(c.currencyId, crafted.transaction, {
      recipient: c.recipient,
    });

    const crypto = cryptoFor(c.currencyId);
    const opReturnData =
      "data" in overrides ? Buffer.from(overrides.data.opReturnData, "hex") : undefined;
    const change = crafted.details?.change as bigint;
    const outputs = [
      { script: crypto.toOutputScript(c.recipient), value: 50_000_000n, isChange: false },
      ...(opReturnData
        ? [{ script: crypto.toOpReturnOutputScript(opReturnData), value: 0n, isChange: false }]
        : []),
      ...(change > 0n
        ? [{ script: crypto.toOutputScript(c.sender), value: change, isChange: true }]
        : []),
    ];
    const bridge = await bridgeArguments(c, ours, outputs, opReturnData);

    expect(ours.outputScriptHex).toBe(bridge.outputScriptHex);
    expect(ours.sigHashType).toBe(bridge.sigHashType);
    expect(ours.segwit).toBe(bridge.segwit ?? false);
    expect(ours.additionals).toEqual(bridge.additionals);
    expect(ours.expiryHeight).toBe((bridge.expiryHeight as Buffer | undefined)?.toString("hex"));
    // Komodo's interest locktime is the signing time minus 777 s: both computed within seconds.
    expect(Math.abs((ours.lockTime ?? 0) - (bridge.lockTime ?? 0))).toBeLessThanOrEqual(5);
    // Same previous transactions, split with the same flags, spent at the same indexes.
    expect(bridge.splits).toEqual(
      ours.inputs.map(input => ({
        hex: input.prevTxHex,
        hasExtraData: ours.hasExtraData,
        additionals: bridge.additionals,
      })),
    );
    expect(bridge.inputs.map(input => input[1])).toEqual(ours.inputs.map(input => input.vout));
    // Replaceable exactly where the bridge's transactions are (any sequence below 0xfffffffe).
    expect(ours.inputs.map(input => input.sequence < 0xfffffffe)).toEqual(
      bridge.inputs.map(input => (input[3] ?? 0xffffffff) < 0xfffffffe),
    );
    expect(ours.changeOutputIndex).toBe(change > 0n ? outputs.length - 1 : undefined);
  });
});

import { http, HttpResponse } from "msw";
import { server } from "../../test/msw";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import * as ecc from "@bitcoinerlab/secp256k1";
import { BIP32Factory } from "bip32";
import { ECPairFactory } from "ecpair";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransaction } from "../craftTransaction";
import { combine } from "../combine";
import { deriveAccountMeta } from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

// Hermetic craft -> sign -> combine chain (otherwise only run by the live coin-tester).
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
const NETWORK = bitcoin.networks.bitcoin;
const MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const DPATH = "84'/0'/0'";

const EXPLORER = "https://btc-explorer.test.ledger.com";
const BASE = `${EXPLORER}/blockchain/v4/btc`;
const context = {
  config: async () => ({ status: { type: "active" }, explorer: { uri: BASE } }),
} as unknown as BitcoinContext;

let XPUB: string;
let ADDR0: string;
let RECIPIENT: string;
let keyPair0: ReturnType<typeof ECPair.fromPrivateKey>;
let fundHex: string;
let fundId: string;
let prevExplorer: unknown;

beforeAll(async () => {
  prevExplorer = getEnv("EXPLORER");
  setEnv("EXPLORER", EXPLORER);
  server.listen({ onUnhandledRequest: "error" });

  const seed = bip39.mnemonicToSeedSync(MNEMONIC);
  const root = bip32.fromSeed(seed, NETWORK);
  const acct = root.derivePath("m/84'/0'/0'");
  XPUB = acct.neutered().toBase58();
  const node0 = acct.derive(0).derive(0);
  keyPair0 = ECPair.fromPrivateKey(Buffer.from(node0.privateKey as Uint8Array));
  const p2wpkh0 = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(node0.publicKey),
    network: NETWORK,
  });
  ADDR0 = p2wpkh0.address as string;
  RECIPIENT = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(acct.derive(0).derive(1).publicKey),
    network: NETWORK,
  }).address as string;

  // Sanity: wallet-btc must derive the same first address from XPUB, else signing can't match.
  const { derivationMode } = deriveAccountMeta(DPATH);
  const wbAddr0 = await cryptoFactory("bitcoin" as unknown as Currency).getAddress(
    derivationMode,
    XPUB,
    0,
    0,
  );
  expect(wbAddr0).toBe(ADDR0);

  // A real funding tx paying 100000 sat to ADDR0 at output 0 (so nonWitnessUtxo validates).
  const fund = new bitcoin.Transaction();
  fund.version = 2;
  fund.addInput(Buffer.alloc(32, 1), 0);
  fund.addOutput(p2wpkh0.output as Buffer, 100_000);
  fundHex = fund.toHex();
  fundId = fund.getId();
});

afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  setEnv("EXPLORER", prevExplorer as string);
});

describe("craft -> sign -> combine (hermetic end-to-end)", () => {
  it("crafts a signable PSBT that combine finalizes into a valid raw transaction", async () => {
    const fundingTx = {
      id: fundId,
      hash: fundId,
      received_at: "2024-06-01T00:00:00Z",
      lock_time: 0,
      fees: "0",
      inputs: [
        {
          output_hash: "prev",
          output_index: 0,
          input_index: 0,
          value: "100000",
          address: "external",
          sequence: 0,
        },
      ],
      outputs: [{ output_index: 0, value: "100000", address: ADDR0 }],
      block: { hash: "b799000", height: 799_000, time: "2024-06-01T00:00:00Z" },
    };
    server.use(
      http.get(`${BASE}/block/current`, () =>
        HttpResponse.json({ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }),
      ),
      http.get(`${BASE}/block/:height`, () =>
        HttpResponse.json([{ height: 800_000, hash: "0000abc", time: "2024-06-01T00:00:00Z" }]),
      ),
      http.get(`${BASE}/address/:address/txs`, ({ params }) =>
        HttpResponse.json(
          params.address === ADDR0 ? { data: [fundingTx], token: null } : { data: [], token: null },
        ),
      ),
      http.get(`${BASE}/address/:address/txs/pending`, () => HttpResponse.json([])),
      http.get(`${BASE}/tx/:hash/hex`, ({ params }) =>
        params.hash === fundId
          ? HttpResponse.json({ hex: fundHex })
          : new HttpResponse("not found", { status: 404 }),
      ),
      http.get(`${BASE}/fees`, () => HttpResponse.json({})),
      http.get(`${BASE}/network`, () => HttpResponse.json({})),
    );

    const intent = {
      sender: XPUB,
      senderDerivationPath: DPATH,
      recipient: RECIPIENT,
      amount: 50_000n,
      asset: { type: "native" },
    } as unknown as TransactionIntent<MemoNotSupported, TxDataNotSupported>;
    const customFees = { parameters: { feePerByte: 1 } } as unknown as FeeEstimation;

    const crafted = await craftTransaction(context, "bitcoin", intent, customFees);
    const unsigned = bitcoin.Psbt.fromBase64(crafted.transaction);
    expect(unsigned.inputCount).toBe(1);
    expect(unsigned.data.inputs[0].witnessUtxo?.value).toBe(100_000);

    // Sign as the device would; bitcoinjs v6 needs Buffer returns, @bitcoinerlab's ECPair gives Uint8Array.
    const signer = {
      publicKey: Buffer.from(keyPair0.publicKey),
      sign: (hash: Buffer): Buffer => Buffer.from(keyPair0.sign(hash)),
    };
    const signed = bitcoin.Psbt.fromBase64(crafted.transaction);
    signed.signInput(0, signer);
    expect(
      signed.validateSignaturesOfInput(0, (pubkey, msghash, sig) =>
        ecc.verify(msghash, pubkey, sig),
      ),
    ).toBe(true);

    const rawHex = combine(crafted.transaction, [signed.toBase64()]);

    const tx = bitcoin.Transaction.fromHex(rawHex);
    expect(tx.ins).toHaveLength(1);
    const recipientScript = bitcoin.address.toOutputScript(RECIPIENT, NETWORK);
    const toRecipient = tx.outs.find(o => o.script.equals(recipientScript));
    expect(toRecipient?.value).toBe(50_000);
    expect(tx.outs.length).toBeGreaterThanOrEqual(2); // recipient + change

    expect(tx.hasWitnesses()).toBe(true);
  });
});

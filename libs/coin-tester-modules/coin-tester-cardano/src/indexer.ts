// The mock backend: a pure in-memory UTXO ledger served over MSW, implementing Strica's proprietary
// `/v1/*` API. Used by the staking scenarios (delegate/undelegate), which can't run on a real node
// until multi-witness signing lands. Sends/token scenarios use the real Yaci devnet instead
// (yaci.ts / yaciIndexer.ts / yaciAdapter.ts).
import { APIDelegation, APITransaction, HashType } from "@ledgerhq/coin-cardano/api/api-types";
import { getProtocolParamsFixture } from "@ledgerhq/coin-cardano/fixtures/protocolParams";
import { getBech32PoolId } from "@ledgerhq/coin-cardano/logic";
import * as cbors from "@stricahq/cbors";
import {
  address as TyphonAddress,
  crypto as TyphonCrypto,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import { Buffer } from "buffer";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MOCK_API } from "./fixtures";

const PAGE_LIMIT = 100;
// Babbage/Conway transaction-body map keys (CDDL): 1 = outputs, 2 = fee, 4 = certificates.
const BODY_OUTPUTS = 1;
const BODY_FEE = 2;
const BODY_CERTIFICATES = 4;
// On-chain certificate tag for stake_delegation (`[2, credential, pool_keyhash]`).
const STAKE_DELEGATION_CERT = 2;
const STAKE_KEY_DEPOSIT = getProtocolParamsFixture().stakeKeyDeposit;

type TxIO = APITransaction["outputs"][number];

// In-memory ledger shared with the MSW handlers. A funded address is just a tx with one output
// to its payment key and no inputs spending it; a submitted tx spends inputs and adds outputs.
const ledger = {
  blockHeight: 0,
  transactions: [] as APITransaction[],
};

// Account-level delegation state, served by /v1/delegation. Null until a stake-delegation
// certificate is submitted, then the active delegation (so getBalance/getStakes reflect it).
let delegationState: APIDelegation | null = null;

let fundCounter = 0;
function pushFunding(address: string, paymentKey: string, output: TxIO): void {
  ledger.blockHeight += 1;
  ledger.transactions.push({
    // Valid 64-char hex: craftTransaction does Buffer.from(txId, "hex") to build inputs.
    hash: (fundCounter++).toString(16).padStart(64, "0"),
    fees: "0",
    timestamp: "1700000000",
    blockHeight: ledger.blockHeight,
    inputs: [],
    outputs: [output],
    certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
  });
}

export function fund(paymentKey: string, address: string, lovelace: bigint): void {
  pushFunding(address, paymentKey, { address, value: lovelace.toString(), paymentKey, tokens: [] });
}

// Fund a UTXO holding a native token alongside ADA (the ADA backs the token's min-UTXO and pays
// the fee + the recipient output's min-UTXO when the token is later sent).
export function fundToken(
  paymentKey: string,
  address: string,
  lovelace: bigint,
  token: { policyId: string; assetName: string; value: bigint },
): void {
  pushFunding(address, paymentKey, {
    address,
    value: lovelace.toString(),
    paymentKey,
    tokens: [
      { policyId: token.policyId, assetName: token.assetName, value: token.value.toString() },
    ],
  });
}

export function resetLedger(): void {
  ledger.blockHeight = 0;
  ledger.transactions = [];
  delegationState = null;
  fundCounter = 0;
}

const touches = (tx: APITransaction, keys: Set<string>) =>
  tx.outputs.some(o => keys.has(o.paymentKey)) || tx.inputs.some(i => keys.has(i.paymentKey));

function findOutput(txId: string, index: number): TxIO {
  const output = ledger.transactions.find(tx => tx.hash === txId)?.outputs[index];
  if (!output) throw new Error(`submit: unknown utxo ${txId}#${index}`);
  return output;
}

function paymentKeyOf(address: TyphonTypes.CardanoAddress): string {
  return address instanceof TyphonAddress.BaseAddress ||
    address instanceof TyphonAddress.EnterpriseAddress ||
    address instanceof TyphonAddress.PointerAddress
    ? address.paymentCredential.hash.toString("hex")
    : "";
}

// @stricahq/cbors decodes outputs as a Babbage map {0: addressBytes, 1: value} (or legacy array),
// and integers as BigNumber — String() normalises both to a lovelace/amount string.
function decodeOutput(raw: unknown): TxIO {
  const fields = raw instanceof Map ? [raw.get(0), raw.get(1)] : (raw as unknown[]);
  const address = TyphonUtils.getAddressFromHex(Buffer.from(fields[0] as Buffer));
  const value = fields[1];

  const tokens: TxIO["tokens"] = [];
  let coin = value;
  if (Array.isArray(value)) {
    coin = value[0];
    const multiasset = value[1] as Map<Buffer, Map<Buffer, unknown>>;
    for (const [policyId, assets] of multiasset)
      for (const [assetName, quantity] of assets)
        tokens.push({
          policyId: Buffer.from(policyId).toString("hex"),
          assetName: Buffer.from(assetName).toString("hex"),
          value: String(quantity),
        });
  }

  return {
    address: address.getBech32(),
    value: String(coin),
    paymentKey: paymentKeyOf(address),
    tokens,
  };
}

// Decode the stake-delegation certificate (`[2, [credType, hashBuf], poolHashBuf]`) from a tx
// body, if present. @stricahq/cbors decodes integers as BigNumber, so the tag is coerced via
// Number(). Returns the account's stake key + the pool key hash, both as hex.
function decodeStakeDelegation(
  body: Map<number, unknown>,
): { stakeKey: string; poolKeyHash: string } | undefined {
  const certs = body.get(BODY_CERTIFICATES);
  if (!Array.isArray(certs)) return undefined;
  for (const cert of certs) {
    if (!Array.isArray(cert) || Number(cert[0]) !== STAKE_DELEGATION_CERT) continue;
    const [, credHash] = cert[1] as [unknown, Buffer];
    return {
      stakeKey: Buffer.from(credHash).toString("hex"),
      poolKeyHash: Buffer.from(cert[2] as Buffer).toString("hex"),
    };
  }
  return undefined;
}

// Decode a signed tx, spend its inputs (resolved against the ledger) and record its outputs, so the
// next getBalance/listOperations sync reflects the send. A stake-delegation certificate also flips
// the served /v1/delegation to active. Returns the tx hash.
function applySignedTx(signedHex: string): string {
  const { value } = cbors.Decoder.decode(Buffer.from(signedHex, "hex"));
  const body = (value as unknown[])[0] as Map<number, unknown>;

  const rawInputs = (body.get(0) as Array<[Buffer, number]>) ?? [];
  const inputs = rawInputs.map(([txHashBuf, index]) => {
    const txId = Buffer.from(txHashBuf).toString("hex");
    const utxo = findOutput(txId, index);
    return { txId, index, ...utxo };
  });
  const outputs = (body.get(BODY_OUTPUTS) as unknown[]).map(decodeOutput);
  const hash = TyphonCrypto.hash32(cbors.Encoder.encode(body)).toString("hex");

  const delegation = decodeStakeDelegation(body);
  const stakeDelegations = delegation
    ? [
        {
          index: 0,
          poolKeyHash: delegation.poolKeyHash,
          stakeCredential: { key: delegation.stakeKey, type: HashType.ADDRESS },
        },
      ]
    : [];

  ledger.blockHeight += 1;
  ledger.transactions.push({
    hash,
    fees: String(body.get(BODY_FEE) ?? 0),
    timestamp: "1700000000",
    blockHeight: ledger.blockHeight,
    inputs,
    outputs,
    certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations },
  });

  if (delegation) {
    delegationState = {
      deposit: STAKE_KEY_DEPOSIT,
      stakeHex: delegation.stakeKey,
      status: true,
      stake: "0",
      rewardsAvailable: "0",
      rewardsWithdrawn: "0",
      poolInfo: {
        poolId: getBech32PoolId(delegation.poolKeyHash, "cardano"),
        name: POOLS[0].name,
        ticker: POOLS[0].ticker,
      },
      dRepInfo: undefined,
    };
  }
  return hash;
}

const POOLS = [
  {
    poolId: "pool1coint3sterxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    name: "Coin Tester Pool",
    ticker: "CTST",
    website: "https://pool.mock",
    margin: "0.03",
    cost: "340000000",
    pledge: "100000000000",
    liveStake: "50000000000000",
  },
];

export function initMSW(): () => void {
  const server = setupServer(
    http.get(`${MOCK_API}/v1/block/latest`, () =>
      HttpResponse.json({ blockHeight: ledger.blockHeight }),
    ),
    http.post(`${MOCK_API}/v1/transaction`, async ({ request }) => {
      const body = (await request.json()) as { paymentKeys: string[]; pageNo: number };
      const keys = new Set(body.paymentKeys);
      const transactions =
        body.pageNo > 1 ? [] : ledger.transactions.filter(tx => touches(tx, keys));
      return HttpResponse.json({ transactions, limit: PAGE_LIMIT });
    }),
    http.get(`${MOCK_API}/v1/network/info`, () =>
      HttpResponse.json({ protocolParams: getProtocolParamsFixture() }),
    ),
    http.get(`${MOCK_API}/v1/delegation`, () => HttpResponse.json({ delegation: delegationState })),
    http.get(`${MOCK_API}/v1/pool/list`, () =>
      HttpResponse.json({ pageNo: 1, limit: PAGE_LIMIT, count: POOLS.length, pools: POOLS }),
    ),
    http.get(`${MOCK_API}/v1/pool/detail`, () => HttpResponse.json({ pools: POOLS })),
    http.post(`${MOCK_API}/v1/transaction/submit`, async ({ request }) => {
      const { transaction } = (await request.json()) as { transaction: string };
      return HttpResponse.json({ transaction: { hash: applySignedTx(transaction) } });
    }),
  );

  server.listen({
    onUnhandledRequest: request => {
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
  return () => server.close();
}

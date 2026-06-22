// Pure translators: Yaci Store (Blockfrost-compatible) JSON → the Strica `/v1/*` shapes coin-cardano
// consumes (`@ledgerhq/coin-cardano/api/api-types`). Side-effect-free, so they unit-test offline.
// Field maps verified against yaci-devkit@0.10.6.
import {
  type APIDelegation,
  type APILatestBlock,
  type APITransaction,
  type TransactionCertificates,
} from "@ledgerhq/coin-cardano/api/api-types";
import { getProtocolParamsFixture } from "@ledgerhq/coin-cardano/fixtures/protocolParams";
import { extractPaymentKeyFromAddress } from "@ledgerhq/coin-cardano/utils";
import type { ProtocolParams } from "@ledgerhq/coin-cardano/types";

const LOVELACE = "lovelace";

// ---- Yaci Store response shapes (the subset we read) -------------------------------------------
export type YaciBlock = { height: number };

export type YaciParams = {
  min_fee_a: number;
  min_fee_b: number;
  key_deposit: string;
  coins_per_utxo_size: string;
  collateral_percent: number;
  price_step: number;
  price_mem: number;
  max_tx_size: number;
  max_val_size: string;
  min_fee_ref_script_cost_per_byte: number;
};

export type YaciAccount = {
  stake_address: string;
  controlled_amount: number | string;
  withdrawable_amount: number | string;
  pool_id: string | null;
};

type YaciAmount = { unit: string; policy_id: string; asset_name: string; quantity: string };
export type YaciTxIO = {
  tx_hash: string;
  output_index: number;
  address: string;
  amount: YaciAmount[];
};
export type YaciTxUtxos = { hash: string; inputs: YaciTxIO[]; outputs: YaciTxIO[] };
export type YaciTxMeta = { tx_hash: string; block_height: number; block_time?: number };

// ---- #1 block/latest ---------------------------------------------------------------------------
export function toLatestBlock(block: YaciBlock): APILatestBlock {
  return { blockHeight: block.height };
}

// ---- #3 network/info (protocol params) ---------------------------------------------------------
// Override the fixture's numeric params with the devnet's live values; keep its `languageView`
// (Plutus cost models) as-is — the tester does plain sends + staking, no Plutus, so it is unused.
export function toProtocolParams(p: YaciParams): ProtocolParams {
  return {
    ...getProtocolParamsFixture(),
    minFeeA: String(p.min_fee_a),
    minFeeB: String(p.min_fee_b),
    stakeKeyDeposit: String(p.key_deposit),
    utxoCostPerByte: String(p.coins_per_utxo_size),
    lovelacePerUtxoWord: String(BigInt(p.coins_per_utxo_size) * 8n), // legacy word = byte × 8
    collateralPercent: String(p.collateral_percent),
    priceSteps: String(p.price_step),
    priceMem: String(p.price_mem),
    maxTxSize: String(p.max_tx_size),
    maxValueSize: String(p.max_val_size),
    minFeeRefScriptCostPerByte: String(p.min_fee_ref_script_cost_per_byte),
  };
}

// ---- #4 delegation -----------------------------------------------------------------------------
// `stakeHex` is the credential the caller queried with (coin-cardano queries /v1/delegation by stake
// key hex). "Is staking" is keyed on `pool_id` (matches the legacy bridge + getstakes-mapping.md):
// a registered-but-undelegated key surfaces as status=false here, which our model treats as inactive.
export function toApiDelegation(
  account: YaciAccount | null,
  stakeHex: string,
  keyDeposit: string,
): APIDelegation | null {
  if (!account) return null;
  const poolId = account.pool_id ?? undefined;
  return {
    status: poolId !== undefined,
    deposit: keyDeposit,
    stakeHex,
    stake: String(account.controlled_amount),
    rewardsAvailable: String(account.withdrawable_amount),
    rewardsWithdrawn: "0",
    poolInfo: poolId ? { poolId, name: undefined, ticker: undefined } : undefined,
    dRepInfo: undefined,
  };
}

// ---- #2 transaction (per-tx inputs/outputs) ----------------------------------------------------
const POLICY_ID_HEX_LEN = 56; // 28-byte policy id

function splitAmount(amount: YaciAmount[]): {
  value: string;
  tokens: APITransaction["outputs"][number]["tokens"];
} {
  let value = "0";
  const tokens: APITransaction["outputs"][number]["tokens"] = [];
  for (const a of amount) {
    if (a.unit === LOVELACE) {
      value = a.quantity;
      continue;
    }
    // Derive policyId/assetName from the canonical Blockfrost `unit` (policyId + assetNameHex) rather
    // than the separate fields — `unit` is what getBalance's asset id concatenation must round-trip to.
    tokens.push({
      policyId: a.unit.slice(0, POLICY_ID_HEX_LEN),
      assetName: a.unit.slice(POLICY_ID_HEX_LEN),
      value: a.quantity,
    });
  }
  return { value, tokens };
}

function toOutput(io: YaciTxIO): APITransaction["outputs"][number] {
  const { value, tokens } = splitAmount(io.amount);
  return {
    address: io.address,
    value,
    paymentKey: extractPaymentKeyFromAddress(io.address),
    tokens,
  };
}

function toInput(io: YaciTxIO): APITransaction["inputs"][number] {
  return { ...toOutput(io), txId: io.tx_hash, index: io.output_index };
}

const EMPTY_CERTIFICATES: TransactionCertificates = {
  stakeRegistrations: [],
  stakeDeRegistrations: [],
  stakeDelegations: [],
};

// Yaci /txs/{hash}/metadata entry (Blockfrost-compatible: label + decoded json_metadata).
export type YaciMetadatum = { label: string | number; json_metadata: unknown };

// Map Yaci tx metadata → the Strica `metadata` shape coin-cardano reads (getMemoFromTx finds label
// "674" and JSON.parses `value`). Returns undefined when the tx carries no metadata.
function toMetadata(hash: string, metadata?: YaciMetadatum[]): APITransaction["metadata"] {
  if (!metadata?.length) return undefined;
  return {
    hash,
    data: metadata.map(m => ({ label: String(m.label), value: JSON.stringify(m.json_metadata) })),
  };
}

// Assemble an APITransaction from Yaci's tx-utxos + tx metadata. Inputs/outputs/tokens/metadata are
// complete; `certificate` is empty (send path).
export function toApiTransaction(
  utxos: YaciTxUtxos,
  meta: YaciTxMeta,
  fees = "0",
  metadata?: YaciMetadatum[],
): APITransaction {
  return {
    hash: utxos.hash,
    fees,
    timestamp: String(meta.block_time ?? 0),
    blockHeight: meta.block_height,
    inputs: utxos.inputs.map(toInput),
    outputs: utxos.outputs.map(toOutput),
    certificate: EMPTY_CERTIFICATES,
    metadata: toMetadata(utxos.hash, metadata),
  };
}

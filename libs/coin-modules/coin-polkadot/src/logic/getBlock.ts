import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { type PolkadotCoinConfig } from "../config";
import api from "../network";
import type { SidecarBlock, SidecarEvent, SidecarExtrinsic } from "../network/types";

const NATIVE_ASSET = { type: "native" } as const;

type SignedExtrinsic = SidecarExtrinsic & {
  signature: NonNullable<SidecarExtrinsic["signature"]>;
};

/**
 * Inherents (timestamp, validation data…) are left out: they pay no fees and carry no transfer.
 */
export async function getBlock(config: PolkadotCoinConfig, height: number): Promise<Block> {
  const block = await api.getBlock(config, height);

  return {
    info: toBlockInfo(block),
    transactions: block.extrinsics.filter(isSigned).map(toBlockTransaction),
  };
}

function toBlockInfo(block: SidecarBlock): BlockInfo {
  const height = Number(block.number);
  return {
    height,
    hash: block.hash,
    time: blockTime(block),
    ...(height > 0 ? { parent: { height: height - 1, hash: block.parentHash } } : {}),
  };
}

function blockTime(block: SidecarBlock): Date {
  const timestampMs = block.extrinsics.find(isPalletMethod("timestamp", "set"))?.args.now;
  if (timestampMs === undefined) {
    throw new Error(`Polkadot block ${block.number} has no timestamp`);
  }
  return new Date(Number(timestampMs));
}

function toBlockTransaction(extrinsic: SignedExtrinsic): BlockTransaction {
  const feePaid = extrinsic.events.find(isPalletMethod("transactionPayment", "TransactionFeePaid"));
  const [feesPayer, actualFee] = feePaid
    ? stringValues(feePaid, 2)
    : [extrinsic.signature.signer.id, "0"];

  return {
    hash: extrinsic.hash,
    failed: !extrinsic.success,
    operations: extrinsic.success
      ? extrinsic.events
          .filter(isPalletMethod("balances", "Transfer"))
          .flatMap(toTransferOperations)
      : [],
    fees: BigInt(actualFee),
    feesPayer,
    details: { palletMethod: `${extrinsic.method.pallet}.${extrinsic.method.method}` },
  };
}

function toTransferOperations(event: SidecarEvent): BlockOperation[] {
  const [from, to, value] = stringValues(event, 3);
  const amount = BigInt(value);
  return [
    { type: "transfer", address: from, peer: to, asset: NATIVE_ASSET, amount: -amount },
    { type: "transfer", address: to, peer: from, asset: NATIVE_ASSET, amount },
  ];
}

function stringValues(event: SidecarEvent, count: number): string[] {
  const values = event.data.slice(0, count);
  if (values.length < count || !values.every(value => typeof value === "string")) {
    throw new Error(
      `Unexpected ${event.method.pallet}.${event.method.method} event data: ${JSON.stringify(event.data)}`,
    );
  }
  return values;
}

const isSigned = (extrinsic: SidecarExtrinsic): extrinsic is SignedExtrinsic =>
  extrinsic.signature !== null;

const isPalletMethod =
  (pallet: string, method: string) =>
  (item: { method: { pallet: string; method: string } }): boolean =>
    item.method.pallet === pallet && item.method.method === method;

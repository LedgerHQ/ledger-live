import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { type PolkadotCoinConfig } from "../config";
import api from "../network";
import type {
  SidecarBlock,
  SidecarEvent,
  SidecarExtrinsic,
  SidecarUndecodedExtrinsic,
} from "../network/types";

const NATIVE_ASSET = { type: "native" } as const;

type SignedExtrinsic = SidecarExtrinsic & {
  signature: NonNullable<SidecarExtrinsic["signature"]>;
};

/**
 * Inherents (timestamp, validation data…) are left out: they pay no fees and carry no transfer.
 */
export async function getBlock(config: PolkadotCoinConfig, height: number): Promise<Block> {
  const block = decoded(await api.getBlock(config, height));

  return {
    info: toBlockInfo(block),
    transactions: block.extrinsics.filter(isSigned).map(toBlockTransaction),
  };
}

type DecodedBlock = SidecarBlock & { extrinsics: SidecarExtrinsic[] };

// An undecodable extrinsic could hide transfers and fees, so a partial block is never returned
function decoded(block: SidecarBlock): DecodedBlock {
  const extrinsics = block.extrinsics.filter(isDecoded);
  if (block.partial || extrinsics.length < block.extrinsics.length) {
    throw new Error(`Polkadot block ${block.number} has extrinsics that cannot be decoded`);
  }
  return { ...block, extrinsics };
}

// Reads the header and the timestamp only, so extrinsics it cannot decode or price do not matter
export function toBlockInfo(block: SidecarBlock): BlockInfo {
  const height = Number(block.number);
  return {
    height,
    hash: block.hash,
    time: blockTime(block),
    ...(height > 0 ? { parent: { height: height - 1, hash: block.parentHash } } : {}),
  };
}

function blockTime(block: SidecarBlock): Date {
  const timestampMs = block.extrinsics.filter(isDecoded).find(isPalletMethod("timestamp", "set"))
    ?.args.now;
  if (timestampMs === undefined) {
    throw new Error(`Polkadot block ${block.number} has no timestamp`);
  }
  return new Date(Number(timestampMs));
}

function toBlockTransaction(extrinsic: SignedExtrinsic): BlockTransaction {
  const { fees, feesPayer, assetFees } = toFees(extrinsic);

  return {
    hash: extrinsic.hash,
    failed: !extrinsic.success,
    operations: extrinsic.success
      ? extrinsic.events
          .filter(isPalletMethod("balances", "Transfer"))
          .flatMap(toTransferOperations)
      : [],
    fees,
    feesPayer,
    details: {
      palletMethod: `${extrinsic.method.pallet}.${extrinsic.method.method}`,
      ...(assetFees ? { assetFees } : {}),
    },
  };
}

type Fees = {
  fees: bigint;
  feesPayer: string;
  assetFees?: { asset: unknown; amount: bigint };
};

function toFees(extrinsic: SignedExtrinsic): Fees {
  const feePaid = extrinsic.events.find(isPalletMethod("transactionPayment", "TransactionFeePaid"));
  if (feePaid) {
    const [feesPayer, actualFee] = stringValues(feePaid, 2);
    return { fees: BigInt(actualFee), feesPayer };
  }

  const assetFeePaid = extrinsic.events.find(isAssetTxFeePaid);
  if (assetFeePaid) {
    const [feesPayer, actualFee] = stringValues(assetFeePaid, 2);
    const asset = assetFeePaid.data[3];
    if (!isLocation(asset)) {
      throw new TypeError(
        `Unexpected asset of the fees of extrinsic ${extrinsic.hash}: ${JSON.stringify(asset)}`,
      );
    }
    // The signer can name the native asset, which debits the native balance
    if (isNativeLocation(asset)) {
      return { fees: BigInt(actualFee), feesPayer };
    }
    // Asset Hub lets the signer pay fees in another asset, leaving the native balance untouched
    return { fees: 0n, feesPayer, assetFees: { asset, amount: BigInt(actualFee) } };
  }

  // Older runtimes emit no TransactionFeePaid event
  const feesPayer = extrinsic.signature.signer.id;
  const tip = BigInt(extrinsic.tip ?? 0);
  if (typeof extrinsic.paysFee !== "boolean") {
    throw new TypeError(`Polkadot extrinsic ${extrinsic.hash} does not say whether it pays fees`);
  }
  if (!extrinsic.paysFee) {
    // The tip is still charged when the inclusion fee is waived
    return { fees: tip, feesPayer };
  }
  const partialFee = extrinsic.info?.partialFee;
  if (partialFee === undefined) {
    throw new Error(`Polkadot extrinsic ${extrinsic.hash} pays fees but reports none`);
  }
  return { fees: BigInt(partialFee) + tip, feesPayer };
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

const isDecoded = (
  extrinsic: SidecarExtrinsic | SidecarUndecodedExtrinsic,
): extrinsic is SidecarExtrinsic => !("decodeError" in extrinsic);

type Location = { parents: string | number; interior: Record<string, unknown> };

const isLocation = (value: unknown): value is Location =>
  typeof value === "object" &&
  value !== null &&
  "parents" in value &&
  (typeof value.parents === "string" || typeof value.parents === "number") &&
  "interior" in value &&
  typeof value.interior === "object" &&
  value.interior !== null;

// The relay chain's token, as the Sidecar writes it: { parents: "1", interior: { here: null } }
const isNativeLocation = (location: Location): boolean =>
  String(location.parents) === "1" && "here" in location.interior;

const isAssetTxFeePaid = (event: SidecarEvent): boolean =>
  isPalletMethod("assetTxPayment", "AssetTxFeePaid")(event) ||
  isPalletMethod("assetConversionTxPayment", "AssetTxFeePaid")(event);

const isSigned = (extrinsic: SidecarExtrinsic): extrinsic is SignedExtrinsic =>
  extrinsic.signature !== null;

const isPalletMethod =
  (pallet: string, method: string) =>
  (item: { method: { pallet: string; method: string } }): boolean =>
    item.method.pallet === pallet && item.method.method === method;

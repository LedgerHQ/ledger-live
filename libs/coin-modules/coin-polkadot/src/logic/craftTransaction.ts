import BigNumber from "bignumber.js";
import { stringCamelCase } from "@polkadot/util";
import type { CoreTransaction, PalletMethodName, PolkadotOperationMode } from "../types";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import polkadotAPI from "../network";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/index";
import { hexToU8a } from "@polkadot/util";
import { CoreTransasctionInfo, TransasctionPayloadInfo } from "../types";

const EXTRINSIC_VERSION = 4;
// Default values for tx parameters, if the user doesn't specify any
const DEFAULTS = {
  tip: 0,
  eraPeriod: 64,
};

export type CreateExtrinsicArg = {
  mode: PolkadotOperationMode;
  amount: BigNumber;
  recipient: string;
  isFirstBond: boolean;
  validators?: string[] | undefined;
  useAllAmount?: boolean | undefined;
  rewardDestination?: string | null | undefined;
  numSlashingSpans?: number | undefined;
  era?: string | null | undefined;
};

type ExtrinsicParams = {
  name: PalletMethodName;
  pallet: "staking" | "balances";
  args: Record<string, string | string[] | number | null | undefined>;
};

const getExtrinsicParams = ({
  mode,
  amount,
  recipient,
  isFirstBond,
  validators,
  useAllAmount,
  rewardDestination,
  numSlashingSpans,
  era,
}: CreateExtrinsicArg): ExtrinsicParams => {
  switch (mode) {
    case "send":
      // Construct a balance transfer transaction offline.
      return {
        pallet: "balances",
        name: useAllAmount ? "transferAllowDeath" : "transferKeepAlive",
        args: {
          dest: recipient,
          value: amount.toString(),
        },
      };

    case "bond":
      if (isFirstBond) {
        return {
          pallet: "staking",
          name: "bond",
          args: {
            value: amount.toString(),
            // The rewards destination. Can be "Stash", "Staked", "Controller" or "{ Account: accountId }"".
            payee: rewardDestination || "Stash",
          },
        };
      } else {
        // Add some extra amount from the stash's `free_balance` into the staking balance.
        // Can only be called when `EraElectionStatus` is `Closed`.
        return {
          pallet: "staking",
          name: "bondExtra",
          args: {
            maxAdditional: amount.toString(),
          },
        };
      }

    case "unbond":
      // Construct a transaction to unbond funds from a Stash account.
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "unbond",
        args: {
          value: amount.toString(),
        },
      };

    case "rebond":
      // Rebond a portion of the stash scheduled to be unlocked.
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "rebond",
        args: {
          value: amount.toString(),
        },
      };

    case "withdrawUnbonded":
      // Remove any unbonded chunks from the `unbonding` queue from our management
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "withdrawUnbonded",
        args: {
          numSlashingSpans: numSlashingSpans || 0,
        },
      };

    case "setController":
      // Set the current account as its own controller
      return {
        pallet: "staking",
        name: "setController",
        args: {},
      };

    case "nominate":
      // Construct a transaction to nominate validators.
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "nominate",
        args: {
          targets: validators,
        },
      };

    case "chill":
      // Declare the desire to cease validating or nominating. Does not unbond funds.
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "chill",
        args: {},
      };

    case "claimReward":
      // Pay out all the stakers behind a single validator for a single era.
      // Any account can call this function, even if it is not one of the stakers.
      // Can only be called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "payoutStakers",
        args: {
          validatorStash: validators ? validators[0] : null,
          era: era,
        },
      };

    default:
      throw new Error("Unknown mode in transaction");
  }
};

export const defaultExtrinsicArg = (amount: bigint, recipient: string): CreateExtrinsicArg => ({
  mode: "send",
  amount: new BigNumber(amount.toString()),
  recipient,
  isFirstBond: false,
});

export async function craftTransaction(
  address: string,
  nonceToUse: number,
  extractExtrinsicArg: CreateExtrinsicArg,
  forceLatestParams: boolean = false,
  runtimeUpgraded: boolean = false,
): Promise<CoreTransaction> {
  await loadPolkadotCrypto();

  const { extrinsics, registry } = await polkadotAPI.getRegistry();
  const info = await polkadotAPI.getTransactionParams({
    force: forceLatestParams,
  });
  // Get the correct extrinsics params depending on transaction
  const extrinsicParams = getExtrinsicParams(extractExtrinsicArg);

  const blockNumber = registry.createType("BlockNumber", info.blockNumber).toHex();
  const era = registry
    .createType("ExtrinsicEra", {
      current: info.blockNumber,
      period: DEFAULTS.eraPeriod,
    })
    .toHex();
  const nonce = registry.createType("Compact<Index>", nonceToUse).toHex();
  const specVersion = registry.createType("u32", info.specVersion).toHex();
  const tip = registry.createType("Compact<Balance>", DEFAULTS.tip).toHex();
  const transactionVersion = registry.createType("u32", info.transactionVersion).toHex();
  const methodFunction = extrinsics[extrinsicParams.pallet][extrinsicParams.name];
  const methodArgs = methodFunction.meta.args;
  const method = methodFunction(
    ...methodArgs.map(arg => {
      const param = extrinsicParams.args[stringCamelCase(arg.name)];
      if (param === undefined) {
        throw new Error(
          `Method ${extrinsicParams.pallet}::${
            extrinsicParams.name
          } expects argument ${arg.toString()}, but got undefined`,
        );
      }

      return param;
    }),
  ).toHex();

  const { blockHash, genesisHash } = info;
  let unsigned: CoreTransasctionInfo | TransasctionPayloadInfo = {
    address,
    blockHash,
    blockNumber,
    era,
    genesisHash,
    method,
    nonce,
    signedExtensions: registry.signedExtensions,
    specVersion,
    tip,
    transactionVersion,
    version: EXTRINSIC_VERSION,
  };
  if (runtimeUpgraded) {
    const metadataHash = await polkadotAPI.metadataHash();
    unsigned = {
      address,
      blockHash,
      era,
      genesisHash,
      method,
      nonce: nonceToUse,
      transactionVersion,
      specVersion,
      version: EXTRINSIC_VERSION,
      metadataHash: hexToU8a("01" + metadataHash),
      mode: 1,
    } as TransasctionPayloadInfo;
  }

  return {
    registry,
    unsigned,
  };
}

/**
 * Transasction using a fake recipient to estimate fees
 * @param account source address
 * @param amount
 */
export async function craftEstimationTransaction(
  account: string,
  amount: bigint,
): Promise<CoreTransaction> {
  return await craftTransaction(
    account,
    0,
    defaultExtrinsicArg(amount, getAbandonSeedAddress("polkadot")),
  );
}

/**
 * Return transaction in raw encoded format (i.e. hexa)
 */
export function rawEncode({ unsigned, registry }: CoreTransaction): string {
  const extrinsic = registry.createType("Extrinsic", unsigned, {
    version: unsigned.version,
  });
  return extrinsic.toHex();
}

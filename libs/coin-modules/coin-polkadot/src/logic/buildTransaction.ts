import BigNumber from "bignumber.js";
import { stringCamelCase } from "@polkadot/util";
import type { PolkadotAccount, PolkadotOperationMode, Transaction } from "../types";
import { isFirstBond, getNonce } from "./utils";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import polkadotAPI from "../network";
const EXTRINSIC_VERSION = 4;
// Default values for tx parameters, if the user doesn't specify any
const DEFAULTS = {
  tip: 0,
  eraPeriod: 64,
};

type CreateExtrinsicArg = {
  mode: PolkadotOperationMode;
  amount: BigNumber;
  recipient: string;
  isFirstBond: boolean;
  validators?: string[];
  useAllAmount?: boolean;
  rewardDestination?: string | null;
  numSlashingSpans?: number;
  era?: string | null;
};
type ExtrinsicParams = {
  name: string;
  pallet: "staking" | "balances";
  args: Record<string, any>;
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

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 * @param {boolean} forceLatestParams - forces the use of latest transaction params
 */
export const buildTransaction = async (
  a: PolkadotAccount,
  t: Transaction,
  forceLatestParams = false,
) => {
  return craftTransaction(
    a.freshAddress,
    getNonce(a),
    {
      mode: t.mode,
      amount: t.amount,
      recipient: t.recipient,
      isFirstBond: isFirstBond(a),
      validators: t.validators,
      useAllAmount: t.useAllAmount,
      rewardDestination: t.rewardDestination,
      numSlashingSpans: a.polkadotResources?.numSlashingSpans,
      era: t.era,
    },
    forceLatestParams,
  );
};

export async function craftTransaction(
  polkadotAddress: string,
  nonceToUse: number,
  extractExtrinsicArg: CreateExtrinsicArg,
  forceLatestParams: boolean = false,
) {
  await loadPolkadotCrypto();

  const { extrinsics, registry } = await polkadotAPI.getRegistry();
  const info = await polkadotAPI.getTransactionParams({
    force: forceLatestParams,
  });
  // Get the correct extrinsics params depending on transaction
  const extrinsicParams = getExtrinsicParams(extractExtrinsicArg);
  const address = polkadotAddress;
  const { blockHash, genesisHash } = info;
  const blockNumber = registry.createType("BlockNumber", info.blockNumber).toHex();
  const era = registry
    .createType("ExtrinsicEra", {
      current: info.blockNumber,
      period: DEFAULTS.eraPeriod,
    })
    .toHex();
  const nonce = registry.createType("Compact<Index>", nonceToUse).toHex();
  const specVersion = registry.createType("u32", info.specVersion).toHex();
  const tip = registry.createType("Compact<Balance>", info.tip || DEFAULTS.tip).toHex();
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
  const unsigned = {
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
  return {
    registry,
    unsigned,
  };
}

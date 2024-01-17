import { stringCamelCase } from "@polkadot/util";
import type { PolkadotAccount, Transaction } from "../types";
import { isFirstBond, getNonce } from "./logic";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import { PolkadotAPI } from "../network";
const EXTRINSIC_VERSION = 4;
// Default values for tx parameters, if the user doesn't specify any
const DEFAULTS = {
  tip: 0,
  eraPeriod: 64,
};

type ExtrinsicParams = {
  name: string;
  pallet: "staking" | "balances";
  args: Record<string, any>;
};
const getExtrinsicParams = (a: PolkadotAccount, t: Transaction): ExtrinsicParams => {
  const validator = t.validators ? t.validators[0] : null;

  switch (t.mode) {
    case "send":
      // Construct a balance transfer transaction offline.
      return {
        args: {
          dest: t.recipient,
          value: t.amount.toString(),
        },
        name: t.useAllAmount ? "transferAllowDeath" : "transferKeepAlive",
        pallet: "balances",
      };

    case "bond":
      if (isFirstBond(a)) {
        return {
          pallet: "staking",
          name: "bond",
          args: {
            value: t.amount.toString(),
            // The rewards destination. Can be "Stash", "Staked", "Controller" or "{ Account: accountId }"".
            payee: t.rewardDestination || "Stash",
          },
        };
      } else {
        // Add some extra amount from the stash's `free_balance` into the staking balance.
        // Can only be called when `EraElectionStatus` is `Closed`.
        return {
          pallet: "staking",
          name: "bondExtra",
          args: {
            maxAdditional: t.amount.toString(),
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
          value: t.amount.toString(),
        },
      };

    case "rebond":
      // Rebond a portion of the stash scheduled to be unlocked.
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "rebond",
        args: {
          value: t.amount.toString(),
        },
      };

    case "withdrawUnbonded":
      // Remove any unbonded chunks from the `unbonding` queue from our management
      // Must be signed by the controller, and can be only called when `EraElectionStatus` is `Closed`.
      return {
        pallet: "staking",
        name: "withdrawUnbonded",
        args: {
          numSlashingSpans: a.polkadotResources?.numSlashingSpans || 0,
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
          targets: t.validators,
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
          validatorStash: validator,
          era: t.era,
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
export const buildTransaction =
  (polkadotAPI: PolkadotAPI) =>
  async (a: PolkadotAccount, t: Transaction, forceLatestParams = false) => {
    await loadPolkadotCrypto();

    const { extrinsics, registry } = await polkadotAPI.getRegistry();
    const info = await polkadotAPI.getTransactionParams({
      force: forceLatestParams,
    });
    // Get the correct extrinsics params depending on transaction
    const extrinsicParams = getExtrinsicParams(a, t);
    const address = a.freshAddress;
    const { blockHash, genesisHash } = info;
    const blockNumber = registry.createType("BlockNumber", info.blockNumber).toHex();
    const era = registry
      .createType("ExtrinsicEra", {
        current: info.blockNumber,
        period: DEFAULTS.eraPeriod,
      })
      .toHex();
    const nonce = registry.createType("Compact<Index>", getNonce(a)).toHex();
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
  };

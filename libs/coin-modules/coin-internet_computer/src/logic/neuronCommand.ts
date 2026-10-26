import { Cbor } from "@icp-sdk/core/agent";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { BigNumber } from "bignumber.js";
import { parseNeuronId } from "../common-logic/neuron";
import { NNS_MAXIMUM_DISSOLVE_DELAY, SECONDS_IN_DAY } from "../consts";
import { ICPDissolveDelayGTMax, ICPInvalidDissolveDelayIncrease } from "../errors";
import {
  createReadStateRequest,
  createUnsignedNeuronCommandTransaction,
  type NeuronCommand,
} from "./buildNeuronTransaction";
import {
  type IcpIntent,
  type IcpNeuronCommandData,
  type IcpStakingIntent,
  senderPublicKeyOf,
} from "./intent";

const NANOS_PER_MILLI = 1_000_000n;

/** The `manage_neuron` commands the API crafts, named as the intent's `type`. */
const NEURON_COMMAND_TYPES: ReadonlySet<string> = new Set([
  "start_dissolving",
  "increase_dissolve_delay",
]);

/** A staking intent for one of the commands. It names its neuron in `valAddress`. */
export const isNeuronCommandIntent = (intent: IcpIntent): intent is IcpStakingIntent =>
  intent.intentType === "staking" && NEURON_COMMAND_TYPES.has(intent.type);

const commandDataOf = (intent: IcpStakingIntent): IcpNeuronCommandData | undefined => {
  const data = "data" in intent ? intent.data : undefined;
  return data?.type === "neuron" ? data : undefined;
};

const aboveMaxDissolveDelay = (): Error => {
  const maxDays = Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY);
  return new ICPDissolveDelayGTMax("", {
    maxSeconds: NNS_MAXIMUM_DISSOLVE_DELAY,
    maxDays,
    count: maxDays,
  });
};

/**
 * The command the intent asks for, or the error that says why it cannot be built. Only checks that
 * need no neuron state run here.
 */
export function neuronCommandOf(intent: IcpStakingIntent): NeuronCommand | Error {
  if (intent.asset.type !== "native") {
    return new InvalidTransactionError(`${intent.asset.type} assets are not supported`);
  }
  const { valAddress } = intent;
  const neuronId = parseNeuronId(valAddress).id;
  if (neuronId === undefined) return new InvalidTransactionError(`Not a neuron id: ${valAddress}`);
  const amount = new BigNumber(0);

  switch (intent.type) {
    case "start_dissolving":
      return { type: intent.type, neuronId, amount };
    case "increase_dissolve_delay": {
      const seconds = commandDataOf(intent)?.additionalDissolveDelaySeconds;
      if (seconds === undefined || !Number.isInteger(seconds) || seconds <= 0) {
        return new ICPInvalidDissolveDelayIncrease();
      }
      // Governance caps the resulting delay at the maximum instead of refusing the excess, so an
      // accepted increase can apply in part. Only the increase alone is checked: the total needs the
      // neuron's current delay.
      if (seconds > NNS_MAXIMUM_DISSOLVE_DELAY) return aboveMaxDissolveDelay();
      return { type: intent.type, neuronId, amount, additionalDissolveDelay: String(seconds) };
    }
    default:
      return new InvalidTransactionError(`${intent.type} is not a neuron command`);
  }
}

/** Why the custom fee cannot be paid, or undefined: governance charges no fee for a command. */
export const unpayableCommandFee = (customFees: FeeEstimation | undefined): string | undefined =>
  customFees && customFees.value !== 0n ? "Neuron commands carry no fee" : undefined;

/**
 * Craft a neuron command as `Cbor.encode({ call, read_state })`: the `manage_neuron` call and the
 * read_state request that polls its status. The device signs both in one interaction
 * (`Cbor.encode({ content: call })` and `Cbor.encode({ content: read_state })`), so a call the node
 * does not answer at once can still be followed to its outcome.
 *
 * Governance commands carry no fee. `details.expiresAt` is the shared ingress expiry (ms epoch).
 */
export function craftNeuronCommand(
  intent: IcpStakingIntent,
  customFees?: FeeEstimation,
): CraftedTransaction {
  const feeRefusal = unpayableCommandFee(customFees);
  if (feeRefusal) throw new Error(`[ICP](craftTransaction) ${feeRefusal}`);
  const senderPublicKey = senderPublicKeyOf(intent);
  const command = neuronCommandOf(intent);
  if (command instanceof Error) throw command;

  const call = createUnsignedNeuronCommandTransaction(command, senderPublicKey);
  const { readStateContent } = createReadStateRequest(call);

  return {
    transaction: Buffer.from(Cbor.encode({ call, read_state: readStateContent })).toString("hex"),
    details: { expiresAt: Number(call.ingress_expiry.toBigInt() / NANOS_PER_MILLI) },
  };
}

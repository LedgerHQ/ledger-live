import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { BigNumber } from "bignumber.js";
import { parseNeuronId } from "../common-logic/neuron";
import {
  FOLLOWABLE_TOPICS,
  MAX_FOLLOWEES_PER_TOPIC,
  MAX_NAT64,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  SECONDS_IN_DAY,
  TRANSFER_FEE,
} from "../consts";
import {
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTMin,
  ICPDuplicateFollowee,
  ICPFolloweeIsSelf,
  ICPFollowTopicNotAllowed,
  ICPHotKeyIsController,
  ICPInvalidDissolveDelayIncrease,
  ICPInvalidFolloweeId,
  ICPInvalidHotKey,
  ICPInvalidPercentage,
  ICPTooManyFollowees,
  NotEnoughTransferAmount,
} from "../errors";
import type { ICPTransactionType } from "../types";
import {
  createReadStateRequest,
  createUnsignedNeuronCommandTransaction,
  type NeuronCommand,
} from "./buildNeuronTransaction";
import {
  fieldError,
  type IcpIntent,
  type IcpNeuronCommandData,
  type IcpStakingIntent,
  neuronDataOf,
  senderPublicKeyOf,
  signerPrincipalOf,
} from "./intent";

const NANOS_PER_MILLI = 1_000_000n;

/** The `manage_neuron` commands, named as the intent's `type`. */
type CommandType = Exclude<
  ICPTransactionType,
  "send" | "create_neuron" | "increase_stake" | "list_neurons"
>;

/** What a command adds to its neuron id, or the error that says why it cannot be built. */
type CommandFields = Partial<Omit<NeuronCommand, "type" | "neuronId">> | Error;

type CommandBuilder = (
  data: IcpNeuronCommandData | undefined,
  intent: {
    neuronId: string;
    amount: bigint;
    recipient: string;
    sender: string;
    signer: string | undefined;
  },
) => CommandFields;

// The bounds are protocol seconds; each error carries whole days too, and `count` repeats them for
// the plural form the apps select. A minimum rounds up and a maximum rounds down.
const belowMinDissolveDelay = (): Error => {
  const minDays = Math.ceil(NNS_MINIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY);
  return new ICPDissolveDelayLTMin("", {
    minSeconds: NNS_MINIMUM_DISSOLVE_DELAY,
    minDays,
    count: minDays,
  });
};

const aboveMaxDissolveDelay = (): Error => {
  const maxDays = Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY);
  return new ICPDissolveDelayGTMax("", {
    maxSeconds: NNS_MAXIMUM_DISSOLVE_DELAY,
    maxDays,
    count: maxDays,
  });
};

const isPrincipal = (text: unknown): text is string => {
  if (typeof text !== "string" || !text) return false;
  try {
    Principal.fromText(text);
    return true;
  } catch {
    return false;
  }
};

/** A maturity command: an absent percentage uses all of the maturity, as the canister does. */
const maturityShare =
  (field: "percentageToSpawn" | "percentageToStake"): CommandBuilder =>
  data => {
    const percentage = data?.percentage;
    if (percentage === undefined) return {};
    const valid = Number.isInteger(percentage) && percentage >= 1 && percentage <= 100;
    return valid ? { [field]: String(percentage) } : new ICPInvalidPercentage();
  };

const isFollowableTopic = (topic: string): topic is keyof typeof FOLLOWABLE_TOPICS =>
  Object.hasOwn(FOLLOWABLE_TOPICS, topic);

// Excluded topics spend a signature for nothing: the canister refuses a retired one, and the device
// refuses one past the Ledger ICP app's cap.
const follow: CommandBuilder = (data, { neuronId }) => {
  const topic = data?.followTopic ?? "Unspecified";
  if (!isFollowableTopic(topic)) return new ICPFollowTopicNotAllowed();
  // An empty list clears the topic, so a missing one is refused rather than read as empty.
  const entries = data?.followeeIds;
  if (!Array.isArray(entries)) return new InvalidTransactionError("follow requires followeeIds");
  if (entries.length > MAX_FOLLOWEES_PER_TOPIC) {
    return new ICPTooManyFollowees("", { max: MAX_FOLLOWEES_PER_TOPIC });
  }
  const followees = new Set<string>();
  for (const entry of entries) {
    const { id } = parseNeuronId(String(entry));
    if (id === undefined) return new ICPInvalidFolloweeId("", { id: entry });
    if (followees.has(id)) return new ICPDuplicateFollowee("", { id });
    if (id === neuronId) return new ICPFolloweeIsSelf("", { id });
    followees.add(id);
  }
  return { followTopic: topic, followeesIds: [...followees] };
};

// The child pays the fee out of the split amount, and the canister refuses a child under the minimum
// stake. The parent's side of that rule needs its stake.
const splitNeuron: CommandBuilder = (_, { amount }) => {
  if (amount < BigInt(MIN_NEURON_STAKE) + TRANSFER_FEE) {
    return fieldError("amount", new NotEnoughTransferAmount());
  }
  if (amount > MAX_NAT64) {
    return fieldError("amount", new InvalidTransactionError(`The amount exceeds ${MAX_NAT64}`));
  }
  return { amount: new BigNumber(amount.toString()) };
};

// The command names no amount and no account, so governance pays the whole stake to the
// controller's default account, which is the sender.
const disburse: CommandBuilder = (_, { amount, recipient, sender }) => {
  if (amount !== 0n) {
    return fieldError("amount", new InvalidTransactionError("disburse pays out the whole stake"));
  }
  if (recipient && recipient.toLowerCase() !== sender.toLowerCase()) {
    return fieldError(
      "recipient",
      new InvalidTransactionError("disburse pays out to the sender's account"),
    );
  }
  return {};
};

// Only the controller signs a hot-key change, so the signer's own principal is the controller.
const addHotKey: CommandBuilder = (data, { signer }) => {
  const hotKey = data?.hotKey;
  if (!isPrincipal(hotKey)) return new ICPInvalidHotKey();
  if (hotKey === signer) return new ICPHotKeyIsController();
  return { hotKeyToAdd: hotKey };
};

const BUILDERS: Record<CommandType, CommandBuilder> = {
  start_dissolving: () => ({}),
  stop_dissolving: () => ({}),
  disburse,
  refresh_voting_power: () => ({}),
  increase_dissolve_delay: data => {
    const seconds = data?.additionalDissolveDelaySeconds;
    if (seconds === undefined || !Number.isInteger(seconds) || seconds <= 0) {
      return new ICPInvalidDissolveDelayIncrease();
    }
    // Governance caps the resulting delay at the maximum instead of refusing the excess, so an
    // accepted increase can apply in part. Only the increase alone is checked: the total needs the
    // neuron's current delay.
    if (seconds > NNS_MAXIMUM_DISSOLVE_DELAY) return aboveMaxDissolveDelay();
    return { additionalDissolveDelay: String(seconds) };
  },
  // Only the network bounds: a delay under the neuron's current one needs its state.
  set_dissolve_delay: data => {
    const seconds = data?.dissolveDelaySeconds;
    if (
      seconds === undefined ||
      !Number.isInteger(seconds) ||
      seconds < NNS_MINIMUM_DISSOLVE_DELAY
    ) {
      return belowMinDissolveDelay();
    }
    if (seconds > NNS_MAXIMUM_DISSOLVE_DELAY) return aboveMaxDissolveDelay();
    return { dissolveDelay: String(seconds) };
  },
  add_hot_key: addHotKey,
  remove_hot_key: data =>
    isPrincipal(data?.hotKey) ? { hotKeyToRemove: data.hotKey } : new ICPInvalidHotKey(),
  auto_stake_maturity: data =>
    typeof data?.autoStakeMaturity === "boolean"
      ? { autoStakeMaturity: data.autoStakeMaturity }
      : new InvalidTransactionError("auto_stake_maturity requires autoStakeMaturity"),
  stake_maturity: maturityShare("percentageToStake"),
  spawn_neuron: maturityShare("percentageToSpawn"),
  spawn_neuron_from_maturity: maturityShare("percentageToSpawn"),
  split_neuron: splitNeuron,
  follow,
};

const COMMAND_TYPES: ReadonlySet<string> = new Set(Object.keys(BUILDERS));

const isCommandType = (type: string): type is CommandType => COMMAND_TYPES.has(type);

/** A staking intent for one of the commands. It names its neuron in `valAddress`. */
export const isNeuronCommandIntent = (intent: IcpIntent): intent is IcpStakingIntent =>
  intent.intentType === "staking" && isCommandType(intent.type);

/**
 * The command the intent asks for, or the error that says why it cannot be built. Only checks that
 * need no neuron state run here. `errorFieldOf` names the intent field an error concerns.
 */
export function neuronCommandOf(intent: IcpStakingIntent): NeuronCommand | Error {
  if (intent.asset.type !== "native") {
    return new InvalidTransactionError(`${intent.asset.type} assets are not supported`);
  }
  const { valAddress, type, amount, recipient, sender } = intent;
  const neuronId = parseNeuronId(valAddress).id;
  if (neuronId === undefined) return new InvalidTransactionError(`Not a neuron id: ${valAddress}`);
  if (!isCommandType(type)) return new InvalidTransactionError(`${type} is not a neuron command`);

  // Without a usable public key, the checks that need the signer are skipped; crafting requires one.
  const fields = BUILDERS[type](neuronDataOf(intent), {
    neuronId,
    amount,
    recipient,
    sender,
    signer: signerPrincipalOf(intent)?.toText(),
  });
  if (fields instanceof Error) return fields;
  return { type, neuronId, amount: new BigNumber(0), ...fields };
}

/**
 * Why the custom fee cannot be paid, or undefined: a command charges no fee to the account. A split
 * or a disburse pays its ledger fee out of the neuron's stake.
 */
export const unpayableCommandFee = (customFees: FeeEstimation | undefined): string | undefined =>
  customFees && customFees.value !== 0n ? "Neuron commands carry no fee" : undefined;

/**
 * Craft a neuron command as `Cbor.encode({ call, read_state })`: the `manage_neuron` call and the
 * read_state request that polls its status. The device signs both in one interaction
 * (`Cbor.encode({ content: call })` and `Cbor.encode({ content: read_state })`), so a call the node
 * does not answer at once can still be followed to its outcome.
 *
 * A command charges no fee to the account. `details.expiresAt` is the shared ingress expiry (ms epoch).
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

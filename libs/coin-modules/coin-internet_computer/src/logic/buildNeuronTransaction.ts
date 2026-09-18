import { Expiry, requestIdOf, SubmitRequestType } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { AccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { sha256 } from "@noble/hashes/sha256";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  KNOWN_TOPICS,
  MAINNET_GOVERNANCE_CANISTER_ID,
} from "../consts";
import { encodeCanisterIdlFunc, getCanisterIdlFunc, governanceIdlFactory } from "../network/candid";
import { ICPNeuron, InternetComputerOperation, Transaction } from "../types";
import { UnsignedTransaction } from "./buildTransaction";
import { derivePrincipalFromPubkey } from "./crypto";

const governanceCanisterId = () => Principal.fromText(MAINNET_GOVERNANCE_CANISTER_ID);

const NeuronIdArg = IDL.Record({ id: IDL.Nat64 });

/**
 * `manage_neuron` request type for Split, narrowed to the one field the device app parses.
 *
 * The app validates the candid *type table*, not just the value, and refuses a `Split` record that
 * does not hold exactly one field (Zondax `nns_parser.c`, `readCommandSplit`), so the canister's
 * current two-field `Split` cannot be signed at all. Omitting `memo` changes nothing that is sent:
 * it is `opt` and we always send it absent, and candid subtyping has the canister read it as `null`.
 */
const SPLIT_ARG_TYPE = IDL.Record({
  id: IDL.Opt(NeuronIdArg),
  command: IDL.Opt(IDL.Variant({ Split: IDL.Record({ amount_e8s: IDL.Nat64 }) })),
  neuron_id_or_subaccount: IDL.Opt(
    IDL.Variant({ Subaccount: IDL.Vec(IDL.Nat8), NeuronId: NeuronIdArg }),
  ),
});

const buildGovernanceCall = (
  methodName: string,
  arg: ArrayBuffer,
  pubKey: string,
): UnsignedTransaction => ({
  request_type: SubmitRequestType.Call,
  canister_id: governanceCanisterId(),
  method_name: methodName,
  arg,
  sender: derivePrincipalFromPubkey(pubKey),
  ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
});

// `manage_neuron` command variant per op (vendored ManageNeuronCommandRequest, bar Split — see
// SPLIT_ARG_TYPE). Candid `opt` = `[]` | `[value]`.
const buildManageNeuronCommand = (transaction: Transaction, nowSeconds: number): unknown => {
  switch (transaction.type) {
    case "start_dissolving":
      return { Configure: { operation: [{ StartDissolving: {} }] } };
    case "stop_dissolving":
      return { Configure: { operation: [{ StopDissolving: {} }] } };
    case "increase_dissolve_delay": {
      const additional = Number(transaction.additionalDissolveDelay);
      if (!Number.isInteger(additional) || additional <= 0) {
        throw new Error(
          "[ICP](buildManageNeuronCommand) increase_dissolve_delay requires a positive additionalDissolveDelay",
        );
      }
      return {
        Configure: {
          operation: [{ IncreaseDissolveDelay: { additional_dissolve_delay_seconds: additional } }],
        },
      };
    }
    case "set_dissolve_delay": {
      const seconds = Number(transaction.dissolveDelay);
      if (!Number.isInteger(seconds) || seconds < 0) {
        throw new Error(
          "[ICP](buildManageNeuronCommand) set_dissolve_delay requires a non-negative integer dissolveDelay",
        );
      }
      // The command takes an absolute unlock timestamp, so add the requested delay to now.
      return {
        Configure: {
          operation: [
            {
              SetDissolveTimestamp: {
                dissolve_timestamp_seconds: BigInt(seconds) + BigInt(nowSeconds),
              },
            },
          ],
        },
      };
    }
    case "add_hot_key": {
      if (!transaction.hotKeyToAdd) {
        throw new Error("[ICP](buildManageNeuronCommand) add_hot_key requires a hotKeyToAdd");
      }
      return {
        Configure: {
          operation: [
            { AddHotKey: { new_hot_key: [Principal.fromText(transaction.hotKeyToAdd)] } },
          ],
        },
      };
    }
    case "remove_hot_key": {
      if (!transaction.hotKeyToRemove) {
        throw new Error("[ICP](buildManageNeuronCommand) remove_hot_key requires a hotKeyToRemove");
      }
      return {
        Configure: {
          operation: [
            {
              RemoveHotKey: { hot_key_to_remove: [Principal.fromText(transaction.hotKeyToRemove)] },
            },
          ],
        },
      };
    }
    case "auto_stake_maturity":
      return {
        Configure: {
          operation: [
            {
              ChangeAutoStakeMaturity: {
                requested_setting_for_auto_stake_maturity: Boolean(transaction.autoStakeMaturity),
              },
            },
          ],
        },
      };
    case "disburse":
      // Full stake to the controller's main account.
      return { Disburse: { to_account: [], amount: [] } };
    case "spawn_neuron":
    case "spawn_neuron_from_maturity":
      return {
        Spawn: {
          percentage_to_spawn: transaction.percentageToSpawn
            ? [Number(transaction.percentageToSpawn)]
            : [],
          new_controller: [],
          nonce: [],
        },
      };
    case "stake_maturity":
      return {
        StakeMaturity: {
          percentage_to_stake: transaction.percentageToStake
            ? [Number(transaction.percentageToStake)]
            : [],
        },
      };
    case "split_neuron": {
      if (!transaction.amount.isFinite() || !transaction.amount.isInteger()) {
        throw new Error(
          "[ICP](buildManageNeuronCommand) split_neuron requires an integer amount in e8s",
        );
      }
      return { Split: { amount_e8s: BigInt(transaction.amount.toFixed(0)) } };
    }
    case "follow": {
      const followees = (transaction.followeesIds ?? []).map(id => {
        if (!/^\d+$/.test(String(id))) {
          throw new Error(
            `[ICP](buildManageNeuronCommand) follow requires numeric followee ids, got "${id}"`,
          );
        }
        return { id: BigInt(id) };
      });
      return {
        Follow: { topic: KNOWN_TOPICS[transaction.followTopic ?? "Unspecified"], followees },
      };
    }
    case "refresh_voting_power":
      return { RefreshVotingPower: {} };
    default:
      throw new Error(`[ICP](buildManageNeuronCommand) unsupported neuron op: ${transaction.type}`);
  }
};

/** ManageNeuronRequest for a neuron operation, targeting the neuron by id. */
export const buildManageNeuronArg = (
  transaction: Transaction,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): unknown => {
  if (!transaction.neuronId) {
    throw new Error("[ICP](buildManageNeuronArg) neuron operation requires a neuronId");
  }
  return {
    id: [{ id: BigInt(transaction.neuronId) }],
    command: [buildManageNeuronCommand(transaction, nowSeconds)],
    neuron_id_or_subaccount: [],
  };
};

/** Every command but Split encodes against the canister's own interface. */
const manageNeuronArgTypes = (transaction: Transaction): IDL.Type[] =>
  transaction.type === "split_neuron"
    ? [SPLIT_ARG_TYPE]
    : getCanisterIdlFunc(governanceIdlFactory, "manage_neuron").argTypes;

/** Unsigned `manage_neuron` update call for a neuron operation. */
export const createUnsignedNeuronCommandTransaction = (
  transaction: Transaction,
  pubKey: string,
): UnsignedTransaction => {
  const arg = IDL.encode(manageNeuronArgTypes(transaction), [buildManageNeuronArg(transaction)]);
  return buildGovernanceCall("manage_neuron", arg, pubKey);
};

/** Unsigned `list_neurons` call fetching the caller's own neurons. */
export const createUnsignedListNeuronsTransaction = (pubKey: string): UnsignedTransaction => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
  const arg = encodeCanisterIdlFunc(func, [
    {
      neuron_ids: [],
      include_neurons_readable_by_caller: true,
      include_empty_neurons_readable_by_caller: [],
      include_public_neurons_in_full_neurons: [],
      neuron_subaccounts: [],
      page_number: [],
      page_size: [],
    },
  ]);
  return buildGovernanceCall("list_neurons", arg, pubKey);
};

/**
 * Read-state request that polls an update call's status. Per @dfinity/agent, the path is
 * `["request_status", requestId]` where requestId is the hash of the CALL content; sender and
 * ingress_expiry are reused from the call.
 */
export const createReadStateRequest = (unsignedTxn: UnsignedTransaction) => {
  const requestId = requestIdOf(unsignedTxn);
  const readStateContent = {
    // @dfinity/agent's ReadRequestType.ReadState — the enum has no runtime export, so use its value.
    request_type: "read_state",
    paths: [[new TextEncoder().encode("request_status"), new Uint8Array(requestId)]],
    sender: unsignedTxn.sender,
    ingress_expiry: unsignedTxn.ingress_expiry,
  };
  return { readStateContent, requestId };
};

// Big-endian u64, matching the canister's `memo.to_be_bytes()` in the neuron-subaccount hash.
const nonceToBytes = (nonce: bigint): Uint8Array => {
  const bytes = new Uint8Array(8);
  let value = nonce;
  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
};

/**
 * The ledger account a neuron stake is transferred to: a governance-canister subaccount derived as
 * SHA-256( 0x0c ‖ "neuron-stake" ‖ controller ‖ nonce_be ). The same `nonce` is the transfer memo,
 * which the governance canister recomputes to claim the neuron.
 */
export const getNeuronStakeSubAccountIdentifier = (
  controller: Principal,
  nonce: bigint,
): string => {
  const padding = new TextEncoder().encode("neuron-stake");
  const data = new Uint8Array([
    padding.length,
    ...padding,
    ...controller.toUint8Array(),
    ...nonceToBytes(nonce),
  ]);
  const subAccount = SubAccount.fromBytes(sha256(data));
  if (subAccount instanceof Error) throw subAccount;
  return AccountIdentifier.fromPrincipal({ principal: governanceCanisterId(), subAccount }).toHex();
};

/**
 * Recover a neuron's stake nonce (needed for a permissionless top-up refresh) from the account's own
 * history: the creating stake transfer's memo is a *candidate*, accepted only if it deterministically
 * re-derives the neuron's known subaccount. This gate (mirroring nns-dapp) means a wrong memo can
 * never be used — the caller falls back when nothing verifies. Returns the verified memo or undefined.
 */
export const recoverStakeMemo = (
  operations: InternetComputerOperation[],
  neuron: ICPNeuron,
  controller: Principal,
): string | undefined => {
  for (const op of operations) {
    const memo = op.extra?.memo;
    // Top-ups carry memo 0; only the creating transfer to this neuron's account is a candidate.
    if (!memo || memo === "0" || op.recipients[0] !== neuron.accountIdentifier) continue;
    try {
      if (
        getNeuronStakeSubAccountIdentifier(controller, BigInt(memo)) === neuron.accountIdentifier
      ) {
        return memo;
      }
    } catch {
      // Non-numeric memo — not a stake nonce.
    }
  }
  return undefined;
};

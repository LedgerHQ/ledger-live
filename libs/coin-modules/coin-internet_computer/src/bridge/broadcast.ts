import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn } from "../api";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  ICP_NETWORK_URL,
} from "../consts";
import {
  governanceIdlFactory as idlFactoryGovernance,
  ListNeuronsResponse,
  ManageNeuronResponse,
  GovernanceCanister,
  getCanisterIdlFunc,
  decodeCanisterIdlFunc,
} from "@zondax/ledger-live-icp";
import { pollForReadState, getAgent } from "@zondax/ledger-live-icp/agent";
import { NeuronsData } from "@zondax/ledger-live-icp/neurons";
import { derivePrincipalFromPubkey } from "@zondax/ledger-live-icp/utils";

// Interface to structure raw data for broadcasting transactions
interface BroadcastRawData {
  encodedSignedCallBlob: string;
  encodedSignedReadStateBlob: string;
  requestId: string;
  methodName: Transaction["type"];
  neuronId?: string;
}

// Main broadcast function for handling Internet Computer transactions
export const broadcast: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["broadcast"] = async ({ account, signedOperation: { operation, rawData } }) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");

  // Type assertion and validation for rawData
  const rawDataTyped = rawData as unknown as BroadcastRawData;
  invariant(rawDataTyped, "[ICP](broadcast) Missing rawData");
  invariant(rawDataTyped.encodedSignedCallBlob, "[ICP](broadcast) Missing encodedSignedCallBlob");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  const sendTypes = ["send", "increase_stake", "create_neuron"];
  const manageNeuronTypes = [
    "start_dissolving",
    "stop_dissolving",
    "disburse",
    "spawn_neuron",
    "stake_maturity",
    "refresh_voting_power",
    "increase_dissolve_delay",
    "auto_stake_maturity",
    "spawn_neuron_from_maturity",
    "set_auto_stake_maturity",
    "set_dissolve_delay",
    "remove_hot_key",
    "add_hot_key",
    "follow",
    "split_neuron",
  ];

  // Logic for different transaction types
  if (sendTypes.includes(rawDataTyped.methodName)) {
    await broadcastTxn(
      Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
  } else {
    await broadcastTxn(
      Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "call",
    );
  }

  // Synchronizing neurons if "list_neurons" is called
  if (
    rawDataTyped.encodedSignedReadStateBlob &&
    rawDataTyped.requestId &&
    rawDataTyped.methodName === "list_neurons"
  ) {
    const reply = await pollForReadState(
      ICP_NETWORK_URL,
      Buffer.from(rawDataTyped.encodedSignedReadStateBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      rawDataTyped.requestId,
    );

    const listNeuronsIdlFunc = getCanisterIdlFunc(idlFactoryGovernance, rawDataTyped.methodName);
    const [listNeuronsResponse] = decodeCanisterIdlFunc<[ListNeuronsResponse]>(
      listNeuronsIdlFunc,
      reply,
    );

    const neurons = new NeuronsData(
      listNeuronsResponse.full_neurons,
      listNeuronsResponse.neuron_infos,
      Date.now(),
      MAINNET_GOVERNANCE_CANISTER_ID,
    );
    return {
      ...operation,
      extra: {
        ...operation.extra,
        neurons,
      },
    } as InternetComputerOperation;
  }

  if (
    rawDataTyped.encodedSignedReadStateBlob &&
    rawDataTyped.requestId &&
    manageNeuronTypes.includes(rawDataTyped.methodName)
  ) {
    const reply = await pollForReadState(
      ICP_NETWORK_URL,
      Buffer.from(rawDataTyped.encodedSignedReadStateBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      rawDataTyped.requestId,
    );

    log("debug", `[ICP](broadcast) manageNeuron reply: ${reply}`);
    const manageNeuronIdlFunc = getCanisterIdlFunc(idlFactoryGovernance, "manage_neuron");

    const [manageNeuronResponse] = decodeCanisterIdlFunc<[ManageNeuronResponse]>(
      manageNeuronIdlFunc,
      reply,
    );

    if (
      manageNeuronResponse.command.length > 0 &&
      manageNeuronResponse.command[0] &&
      "Error" in manageNeuronResponse.command[0]
    ) {
      throw new Error(
        manageNeuronResponse.command[0].Error.error_message ||
          `Unknown error when attempting to ${rawDataTyped.methodName} on ${rawDataTyped.neuronId}`,
      );
    }

    log("debug", `[ICP](broadcast) manageNeuronResponse: ${manageNeuronResponse}`);

    return operation;
  }

  // Additional logic post-transaction broadcast

  // Additional step for neuron creation
  if (rawDataTyped.methodName === "create_neuron") {
    invariant(account.xpub, `[ICP](broadcast-${rawDataTyped.methodName}) Missing account xpub`);

    const agent = await getAgent(ICP_NETWORK_URL);
    const govCanister = GovernanceCanister.create({ agent });

    const memo = (operation as InternetComputerOperation).extra.memo;
    invariant(memo, "[ICP](broadcast) Missing memo");

    log("debug", `[ICP](broadcast) Claiming or refreshing neuron with memo: ${memo}`);
    // try this 3 times with increasing delay
    let neuronId: bigint | undefined = undefined;
    for (let i = 0; i < 3; i++) {
      try {
        neuronId = await govCanister.claimOrRefreshNeuronFromAccount({
          memo: BigInt(memo),
          controller: derivePrincipalFromPubkey(account.xpub),
        });
        break;
      } catch (e) {
        log("error", `[ICP](broadcast) Error claiming or refreshing neuron: ${e}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    invariant(neuronId, `[ICP](broadcast) Failed to claim or refresh neuron with memo: ${memo}`);
    return {
      ...operation,
      extra: {
        ...operation.extra,
        createdNeuronId: neuronId?.toString(),
      },
    } as InternetComputerOperation;
  }

  // Additional step for neuron stake increase
  if (rawDataTyped.methodName === "increase_stake") {
    invariant(account.xpub, `[ICP](broadcast-${rawDataTyped.methodName}) Missing account xpub`);

    const agent = await getAgent(ICP_NETWORK_URL);
    const govCanister = GovernanceCanister.create({ agent });

    invariant(
      rawDataTyped.neuronId,
      `[ICP](broadcast-${rawDataTyped.methodName}) Missing neuronId`,
    );

    await govCanister.claimOrRefreshNeuron({
      neuronId: BigInt(rawDataTyped.neuronId),
      by: undefined,
    });
  }

  return operation;
};

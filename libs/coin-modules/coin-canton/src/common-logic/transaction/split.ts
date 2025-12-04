import * as protobuf from "protobufjs";
import type { PrepareTransferResponse } from "../../types/gateway";
import { CantonPreparedTransaction } from "../../types/signer";
import * as transactionProto from "../../types/transaction-proto.json";

const root: { [key: string]: any } = protobuf.Root.fromJSON(transactionProto) || {};

const RESERVED_WORDS = {
  bool: "bool_",
  enum: "enum_",
  constructor: "constructor_",
};

const replaceReservedWords = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(replaceReservedWords);

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    transformed[RESERVED_WORDS[key as keyof typeof RESERVED_WORDS] || key] =
      replaceReservedWords(value);
  }
  return transformed;
};

/**
 * Splits a Canton transaction into components for prepared transaction signing.
 * Converts protobuf transaction data into structured components that can be
 * sent to the Ledger device for signing.
 */
export function splitTransaction(
  transaction: PrepareTransferResponse["json"],
): CantonPreparedTransaction {
  const { transaction: transactionData, metadata } = transaction;

  // Process DAML transaction
  const DeviceDamlTransaction = root.lookupType(
    "com.daml.ledger.api.v2.interactive.DeviceDamlTransaction",
  );

  const damlTransactionBytes = DeviceDamlTransaction.encode({
    version: transactionData.version,
    roots: transactionData.roots,
    nodesCount: transactionData.nodes?.length || 0,
    nodeSeeds: (transactionData.nodeSeeds || []).map((seed: any) => ({
      seed: Uint8Array.from(Buffer.from(seed.seed, "base64")),
      ...(seed.nodeId && seed.nodeId !== 0 && { nodeId: seed.nodeId }),
    })),
  }).finish();

  // Process input contracts
  const inputContracts = (metadata.inputContracts || []).map((contract: any) => {
    const { eventBlob, ...contractWithoutBlob } = contract;
    const InputContract = root.lookupType(
      "com.daml.ledger.api.v2.interactive.DeviceMetadata.InputContract",
    );
    const contractPb = InputContract.fromObject(replaceReservedWords(contractWithoutBlob));
    return InputContract.encode(contractPb).finish();
  });

  // Process metadata
  const metadataData = {
    submitterInfo: {
      actAs: metadata.submitterInfo.actAs,
      commandId: metadata.submitterInfo.commandId,
    },
    synchronizerId: metadata.synchronizerId,
    ...(metadata.mediatorGroup !== undefined && { mediatorGroup: metadata.mediatorGroup }),
    transactionUuid: metadata.transactionUuid,
    submissionTime: Number.parseInt(metadata.preparationTime, 10),
    inputContractsCount: metadata.inputContracts?.length || 0,
    ...(metadata.minLedgerEffectiveTime && {
      minLedgerEffectiveTime: Number.parseInt(metadata.minLedgerEffectiveTime, 10),
    }),
    ...(metadata.maxLedgerEffectiveTime && {
      maxLedgerEffectiveTime: Number.parseInt(metadata.maxLedgerEffectiveTime, 10),
    }),
  };

  const DeviceMetadata = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceMetadata");
  const metadataBytes = DeviceMetadata.encode(metadataData).finish();

  // Process nodes
  const nodesArray = transactionData.nodes || [];
  const nodes = new Array(nodesArray.length);

  for (const node of nodesArray) {
    const nodeId = Number.parseInt(node.nodeId || "0", 10);
    const Node = root.lookupType("com.daml.ledger.api.v2.interactive.DeviceDamlTransaction.Node");
    const nodePb = Node.fromObject(replaceReservedWords(node));
    const pos = nodesArray.length - 1 - nodeId;
    nodes[pos] = Node.encode(nodePb).finish();
  }

  return {
    damlTransaction: damlTransactionBytes,
    nodes,
    metadata: metadataBytes,
    inputContracts,
  };
}

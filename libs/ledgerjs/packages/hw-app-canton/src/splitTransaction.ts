import type { CantonPreparedTransaction } from "./Canton";
import type { CantonTransactionJson, CantonInputContract, CantonTransactionNode } from "./types";
import {
  encodeDamlTransaction,
  encodeInputContract,
  encodeMetadata,
  encodeNode,
} from "./encodeTransaction";

/**
 * Splits a Canton transaction into components for prepared transaction signing.
 * Converts protobuf transaction data into structured components that can be
 * sent to the Ledger device for signing.
 *
 * @param transaction - The transaction JSON structure from the Gateway API
 * @returns Prepared transaction components ready for device signing
 */
export function splitTransaction(transaction: CantonTransactionJson): CantonPreparedTransaction {
  const { transaction: transactionData, metadata } = transaction;

  // Process DAML transaction
  const damlTransactionBytes = encodeDamlTransaction({
    version: transactionData.version,
    roots: transactionData.roots,
    nodesCount: transactionData.nodes?.length || 0,
    nodeSeeds: (transactionData.nodeSeeds || []).map(seed => ({
      seed: Uint8Array.from(Buffer.from(seed.seed, "base64")),
      ...(seed.nodeId && seed.nodeId !== 0 && { nodeId: seed.nodeId }),
    })),
  });

  // Process input contracts
  const inputContracts = (metadata.inputContracts || []).map((contract: CantonInputContract) =>
    encodeInputContract(contract),
  );

  // Process metadata
  const metadataBytes = encodeMetadata({
    submitterInfo: {
      actAs: metadata.submitterInfo.actAs,
      commandId: metadata.submitterInfo.commandId,
    },
    synchronizerId: metadata.synchronizerId,
    ...(metadata.mediatorGroup !== undefined && { mediatorGroup: metadata.mediatorGroup }),
    transactionUuid: metadata.transactionUuid,
    preparationTime: Number.parseInt(metadata.preparationTime, 10),
    inputContractsCount: metadata.inputContracts?.length || 0,
    ...(metadata.minLedgerEffectiveTime && {
      minLedgerEffectiveTime: Number.parseInt(metadata.minLedgerEffectiveTime, 10),
    }),
    ...(metadata.maxLedgerEffectiveTime && {
      maxLedgerEffectiveTime: Number.parseInt(metadata.maxLedgerEffectiveTime, 10),
    }),
  });

  // Process nodes
  const nodesArray: CantonTransactionNode[] = transactionData.nodes || [];
  const nodes = new Array(nodesArray.length);

  for (const node of nodesArray) {
    const nodeId = Number.parseInt(node.nodeId || "0", 10);
    const nodeBytes = encodeNode(node);
    const pos = nodesArray.length - 1 - nodeId;
    nodes[pos] = nodeBytes;
  }

  return {
    damlTransaction: damlTransactionBytes,
    nodes,
    metadata: metadataBytes,
    inputContracts,
  };
}

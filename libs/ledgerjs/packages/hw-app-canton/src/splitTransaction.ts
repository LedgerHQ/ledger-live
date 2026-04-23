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
  const damlTransactionBytes = encodeDamlTransaction(transactionData);

  // Process input contracts
  const inputContracts = (metadata.inputContracts || []).map((contract: CantonInputContract) =>
    encodeInputContract(contract),
  );

  // Process metadata
  const metadataBytes = encodeMetadata(metadata, inputContracts.length);

  // Process nodes
  const nodesArray: CantonTransactionNode[] = transactionData.nodes || [];
  const nodes = new Array(nodesArray.length);
  const lastIndex = nodesArray.length - 1;

  for (const node of nodesArray) {
    const nodeId = Number.parseInt(node.nodeId || "0", 10);
    const nodeBytes = encodeNode(node);
    const pos = lastIndex - nodeId;
    nodes[pos] = nodeBytes;
  }

  return {
    damlTransaction: damlTransactionBytes,
    nodes,
    metadata: metadataBytes,
    inputContracts,
  };
}

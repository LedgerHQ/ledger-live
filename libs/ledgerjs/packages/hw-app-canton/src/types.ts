/**
 * Type definitions for Canton transaction JSON structure
 * These types represent the structure of transaction data from the Gateway API
 * that needs to be split into device-compatible components.
 */

export interface CantonTransactionJson {
  transaction: CantonTransactionData;
  metadata: CantonTransactionMetadata;
}

export interface CantonTransactionData {
  version: string;
  roots: string[];
  nodes?: CantonTransactionNode[];
  nodeSeeds?: CantonNodeSeed[];
}

export interface CantonNodeSeed {
  seed: string; // base64 encoded
  nodeId?: number;
}

export interface CantonTransactionNode {
  nodeId?: string;
  v1?: {
    create?: unknown;
    exercise?: unknown;
    fetch?: unknown;
    lookupByKey?: unknown;
  };
  [key: string]: unknown;
}

export interface CantonTransactionMetadata {
  submitterInfo: CantonSubmitterInfo;
  synchronizerId: string;
  transactionUuid: string;
  preparationTime: string;
  inputContracts?: CantonInputContract[];
  mediatorGroup?: number;
  minLedgerEffectiveTime?: string;
  maxLedgerEffectiveTime?: string;
}

export interface CantonSubmitterInfo {
  actAs: string[];
  commandId: string;
}

export interface CantonInputContract {
  v1?: {
    lfVersion?: string;
    contractId?: string;
    packageName?: string;
    [key: string]: unknown;
  };
  eventBlob?: string;
  [key: string]: unknown;
}

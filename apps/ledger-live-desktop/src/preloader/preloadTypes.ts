import type {
  AccountTransactionHeader,
  AccountTransactionSignature,
  BakerId,
  ConsensusStatus,
  CryptographicParameters,
  // Referenced in jsdoc
  /* eslint-disable @typescript-eslint/no-unused-vars */
  BakerPoolStatus,
  HealthCheckResponse,
  PassiveDelegationStatus,
  RewardStatus,
  UpdateInstruction,
  NextUpdateSequenceNumbers,
  NextAccountNonce,
  ChainParameters,
  AccountInfo,
  BlockItemStatus,
  BlockItemSummaryInBlock,
  TransactionHash,
  IpInfo,
  ArInfo,
  /* eslint-enable @typescript-eslint/no-unused-vars */
} from "@concordium/web-sdk";

import {
  TokenId,
  // Referenced in jsdoc
  /* eslint-disable @typescript-eslint/no-unused-vars */
  TokenInfo,
} from "@concordium/web-sdk/plt";
import {
  OpenDialogOptions,
  OpenDialogReturnValue,
  Rectangle,
  SaveDialogOptions,
  SaveDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from "electron";
import { Logger } from "winston";
import type { Buffer } from "buffer/";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Listener = (event: any, ...args: any[]) => void;
type PutListener = (callback: Listener) => void;
type PutListenerWithUnsub = (callback: Listener) => () => void;

export interface Listen {
  openRoute: PutListener;
  readyToShow: PutListener;
  didFinishLoad: PutListener;
  ledgerChannel: PutListener;
  logFromMain: PutListener;
}

export interface Once {
  onAwaitVerificationKey: PutListener;
  onVerificationKeysConfirmed: PutListener;
}

type ConsensusAndGlobalResultSuccess = {
  successful: true;
  response: {
    consensusStatus: ConsensusStatus;
    global: CryptographicParameters;
  };
};

type ConsensusAndGlobalResultFailure = {
  successful: false;
  error: Error;
};

export type ConsensusAndGlobalResult =
  | ConsensusAndGlobalResultSuccess
  | ConsensusAndGlobalResultFailure;

type GetAccountInfo = (address: string, blockHash?: string) => Promise<string>;

// TODO: ensure that messsages sent through exposed functions are properly serialized
export type GRPC = {
  setLocation: (address: string, port: string, useSsl: boolean) => void;
  /**
   * @returns stringified {@linkcode ConsensusAndGlobalResult}
   */
  nodeConsensusAndGlobal: (address: string, port: string, useSsl: boolean) => Promise<string>;
  /**
   * @returns stringified {@linkcode TransactionHash.Type}
   */
  sendAccountTransaction: (
    header: AccountTransactionHeader,
    energyCost: bigint,
    payload: Buffer,
    signature: AccountTransactionSignature,
  ) => Promise<string>;
  /**
   * @returns stringified {@linkcode TransactionHash.Type}
   */
  sendUpdateInstruction: (
    updateInstructionTransaction: UpdateInstruction,
    signatures: Record<number, string>,
  ) => Promise<string>;
  /**
   * @returns stringified {@linkcode TransactionHash.Type}
   */

  /**
   * @returns stringified {@linkcode CryptographicParameters}
   */
  getCryptographicParameters: (blockHash: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode ConsensusStatus}
   */
  getConsensusStatus: () => Promise<string>;
  /**
   * @returns stringified {@linkcode BlockItemStatus}
   */
  getTransactionStatus: (transactionId: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode BlockItemSummaryInBlock}
   */
  waitForTransactionFinalization: (transactionId: string, timeoutms?: number) => Promise<string>;
  /**
   * @returns stringified {@linkcode NextAccountNonce}
   */
  getNextAccountNonce: (address: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode ChainParameters}
   */
  getBlockChainParameters: (blockHash?: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode NextUpdateSequenceNumbers}
   */
  getNextUpdateSequenceNumbers: (blockHash?: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode AccountInfo}
   */
  getAccountInfoOfCredential: GetAccountInfo;
  /**
   * @returns stringified {@linkcode AccountInfo}
   */
  getAccountInfo: GetAccountInfo;
  /**
   * @returns stringified {@linkcode IpInfo[]}
   */
  getIdentityProviders: (blockHash: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode ArInfo[]}
   */
  getAnonymityRevokers: (blockHash: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode TokenInfo[]}
   */
  getTokenInfo: (tokenId: TokenId.Type) => Promise<string>;
  /**
   * @returns stringified {@linkcode HealthCheckResponse}
   */
  healthCheck: () => Promise<string>;
  /**
   * @returns stringified {@linkcode RewardStatus}
   */
  getRewardStatus: (blockHash?: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode BakerPoolStatus}
   */
  getPoolInfo: (bakerId: BakerId, blockHash?: string) => Promise<string>;
  /**
   * @returns stringified {@linkcode PassiveDelegationStatus}
   */
  getPassiveDelegationInfo: (blockHash?: string) => Promise<string>;
};

export type FileMethods = {
  databaseExists: () => Promise<boolean>;
  saveFile: (filepath: string, data: string | Buffer) => Promise<boolean>;
  saveFileDialog: (opts: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
  openFileDialog: (opts: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
};

export interface DecryptionData {
  data: string;
  error?: never;
}
interface DecryptionError {
  data?: never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}
export type DecryptionResult = DecryptionData | DecryptionError;

export interface HttpGetResponse<T> {
  data: T;
  headers: Record<string, string>;
  status: number;
}

export type GeneralMethods = {
  rekeyDatabase: (oldPassword: string, newPassword: string) => Promise<boolean>;
  checkAccess: () => Promise<boolean>;
  setPassword: (password: string) => void;
  invalidateKnexSingleton: () => void;
  migrate: () => Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectFirst: (tableName: string) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectAll: (tableName: string) => Promise<any>;
};

export type CredentialMethods = {
  insert: (cred: Credential) => Promise<number[]>;
  delete: (cred: Partial<Credential>) => Promise<number>;
  deleteForAccount: (address: string) => Promise<number>;
  getAll: () => Promise<Credential[]>;
  getForIdentity: (identityId: number) => Promise<Credential[]>;
  getForAccount: (address: string) => Promise<Credential[]>;
  getNextNumber: (identityId: number) => Promise<number>;
  updateIndex: (credId: string, credentialIndex: number | undefined) => Promise<number>;
  update: (credId: string, updatedValues: Partial<Credential>) => Promise<number>;
  hasDuplicateWalletId: (
    accountAddress: string,
    credId: string,
    otherCredIds: string[],
  ) => Promise<boolean>;
  hasExistingCredential: (accountAddress: string, currentWalletId: number) => Promise<boolean>;
};

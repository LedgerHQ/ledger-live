export interface LastBlockHeight {
  lastBlockHeight: number;
}

export interface ChainAccount {
  balance: number;
  chainId: string;
}

interface ChainAccounts {
  chainAccounts: ChainAccount[];
}

export interface GetChainAccountResponse {
  fungibleAccount: ChainAccounts | null;
}

interface AccountBalance {
  totalBalance: number;
}

export interface GetAccountBalanceResponse {
  fungibleAccount: AccountBalance | null;
}

export interface Block {
  creationTime: string;
  height: number;
  hash: string;
}

export interface Transaction {
  result: {
    badResult: string;
    goodResult: string;
  };
}

export interface Transfer {
  id: string;
  amount: number;
  block: Block;
  blockHash: string;
  chainId: number;
  creationTime: Date;
  crossChainTransfer: Transfer | null;
  height: number;
  receiverAccount: string;
  senderAccount: string;
  requestKey: string;
  moduleName: string;
  transaction: Transaction;
}

export interface TransfersConnectionEdge {
  node: Transfer;
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
}

export interface TransferConnection {
  edges: TransfersConnectionEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface GetTransfers {
  transfers: TransferConnection;
}

export interface ErrorResponse {
  message: string;
  path: string[];
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: ErrorResponse[];
}

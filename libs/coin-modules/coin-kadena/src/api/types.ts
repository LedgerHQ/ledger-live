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
  chainId: number;
  creationTime: string;
  height: number;
  hash: string;
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
}

export interface Connection<T> {
  edges: { node: T }[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Event {
  name: string;
  parameters: string;
}

export interface Transaction {
  result: {
    badResult: string | null;
    goodResult: string | null;
    gas: number;
  };
  cmd: {
    signers: {
      clist: {
        args: string;
        name: string;
      }[];
    }[];
  };
}

export interface Transfer {
  id: string;
  amount: number;
  block: Block;
  blockHash: string;
  creationTime: Date;
  crossChainTransfer: Transfer | null;
  height: number;
  receiverAccount: string;
  senderAccount: string;
  requestKey: string;
  moduleName: string;
  transaction: Transaction;
}

export interface GetTransfers {
  transfers: Connection<Transfer>;
}

export interface GetEvents {
  events: Connection<Event>;
}

export interface ErrorResponse {
  message: string;
  path: string[];
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: ErrorResponse[];
}

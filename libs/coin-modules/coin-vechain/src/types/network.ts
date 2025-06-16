export interface AccountResponse {
  balance: string;
  energy: string;
  hasCode: boolean;
}

export interface LogMeta {
  blockID: string;
  blockNumber: number;
  blockTimestamp: number;
  txID: string;
  txOrigin: string;
  clauseIndex: number;
}

export interface TransferLog {
  sender: string;
  recipient: string;
  amount: string;
  meta: LogMeta;
}

export interface EventLog {
  address: string;
  topics: string[];
  data: string;
  meta: LogMeta;
}

export interface Range {
  unit: "block";
  from: number;
  to?: number;
}

export interface Options {
  offset: number;
  limit: number;
}

export interface VetCriteria {
  recipient?: string;
  sender?: string;
}

export interface VetTxsQuery {
  range?: Range;
  options?: Options;
  criteriaSet: VetCriteria[];
  order: "desc" | "asc";
}

export interface TokenCriteria {
  address: string;
  topic0?: string;
  topic1?: string;
  topic2?: string;
  topic3?: string;
  topic4?: string;
}

export interface TokenTxsQuery {
  range?: Range;
  options?: Options;
  criteriaSet: TokenCriteria[];
  order: "desc" | "asc";
}

export interface Query {
  to: string;
  data: string;
}

export interface QueryResponse {
  data: string;
  events: any[];
  transfers: any[];
  gasUsed: number;
  reverted: boolean;
  vmError: string;
}

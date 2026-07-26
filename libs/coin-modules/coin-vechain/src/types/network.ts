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

/** Thor `GET /blocks/{revision}` transfer (VET or VIP180 event, when `expanded=true`). */
export interface ApiResponseBlockTransfer {
  sender: string;
  recipient: string;
  amount: string;
}

/** A single clause output, part of an expanded block transaction. */
export interface ApiResponseBlockOutput {
  contractAddress: string | null;
  events: EventLog[];
  transfers: ApiResponseBlockTransfer[];
}

/** An expanded transaction, as returned by Thor `GET /blocks/{revision}?expanded=true`. */
export interface ApiResponseBlockTransaction {
  id: string;
  origin: string;
  gasPayer?: string;
  gasUsed: number;
  paid: string;
  reverted: boolean;
  outputs: ApiResponseBlockOutput[];
}

/** Thor `GET /blocks/{revision}` response. */
export interface ApiResponseBlock {
  id: string;
  number: number;
  timestamp: number;
  /** Transaction ids (`string[]`) when `expanded=false`, full transactions when `expanded=true`. */
  transactions: unknown[];
}

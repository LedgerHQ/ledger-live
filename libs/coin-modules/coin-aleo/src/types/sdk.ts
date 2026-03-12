export interface AleoEncryptedRegistrationResponse {
  encrypted: string;
}

export interface AleoDecryptedRecordResponse {
  owner: string;
  data: Record<string, string>;
  nonce: string;
  version: number;
}

export interface PreparedRequestResponse {
  is_root: boolean;
  network_id: number;
  program_id: string;
  function_name: string;
  inputs: string[];
  input_types: string[];
  nested_calls?: PreparedRequestResponse[];
  record_commitments?: string[];
}

interface TransferPrivateIntent {
  type: "transfer_private";
  amount: string;
  to: string;
  record: string;
}

interface TransferPublicIntent {
  type: "transfer_public";
  amount: string;
  to: string;
}

interface TransferPrivateToPublicIntent {
  type: "transfer_private_to_public";
  amount: string;
  to: string;
  record: string;
}

interface TransferPublicToPrivateIntent {
  type: "transfer_public_to_private";
  amount: string;
  to: string;
}

interface FeePrivateIntent {
  type: "fee_private";
  base_fee: string;
  priority_fee: string;
  execution_id: string;
  record: string;
}

interface FeePublicIntent {
  type: "fee_public";
  base_fee: string;
  priority_fee: string;
  execution_id: string;
}

export type Intent =
  | TransferPrivateIntent
  | TransferPublicIntent
  | TransferPrivateToPublicIntent
  | TransferPublicToPrivateIntent
  | FeePrivateIntent
  | FeePublicIntent;

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

export interface DecryptResponse {
  owner: string;
  data: Record<string, unknown>;
  nonce: string;
  version: number;
}

export interface PrepareRequestBody {
  view_key: string;
  intent: Intent;
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

export interface AuthorizationResponse {
  authorization: string;
  execution_id: string;
}

// TODO: remove dev types
export interface DevKeysResponse {
  view_key: string;
  compute_key: string;
  address: string;
}

export interface DevSignatureData {
  signature: string;
  tvk: string;
  tpk: string;
  gammas: string[];
  nested_calls?: DevSignatureData[];
}

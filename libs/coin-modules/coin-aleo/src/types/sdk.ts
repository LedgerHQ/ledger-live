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
  tlv: string;
}

type TransferPrivateIntent =
  | {
      type: "transfer_private";
      amount: string;
      to: string;
      record: AleoDecryptedRecordResponse;
    }
  | {
      type: `transfer_private_${number}`;
      amount: string;
      to: string;
      records: AleoDecryptedRecordResponse[];
    };

interface TransferPublicIntent {
  type: "transfer_public";
  amount: string;
  to: string;
}

type TransferPrivateToPublicIntent =
  | {
      type: "transfer_private_to_public";
      amount: string;
      to: string;
      record: AleoDecryptedRecordResponse;
    }
  | {
      type: `transfer_private_to_public_${number}`;
      amount: string;
      to: string;
      records: AleoDecryptedRecordResponse[];
    };

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
  record: AleoDecryptedRecordResponse;
}

interface FeePublicIntent {
  type: "fee_public";
  base_fee: string;
  priority_fee: string;
  execution_id: string;
}

interface TransferTokenPublicIntent {
  type: "transfer_token_public";
  amount: string;
  to: string;
  program_id: string;
}

interface TransferTokenPublicToPrivateIntent {
  type: "transfer_token_public_to_private";
  amount: string;
  to: string;
  program_id: string;
}

export type Intent =
  | TransferPrivateIntent
  | TransferPublicIntent
  | TransferPrivateToPublicIntent
  | TransferPublicToPrivateIntent
  | TransferTokenPublicIntent
  | TransferTokenPublicToPrivateIntent
  | FeePrivateIntent
  | FeePublicIntent;

export interface FeeConfiguration {
  function_name: "fee_private" | "fee_public";
  max_base_fee: string;
  max_priority_fee: string;
}

export interface AuthorizationResponse {
  authorization: string;
  execution_id: string;
}

export interface EncryptProvingRequestResponse {
  encrypted: string;
}

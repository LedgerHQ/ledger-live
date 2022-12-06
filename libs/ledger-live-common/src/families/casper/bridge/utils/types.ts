export interface NodeRPCPayload {
  jsonrpc: "2.0";
  method:
    | "info_get_status"
    | "chain_get_state_root_hash"
    | "state_get_account_info"
    | "state_get_balance"
    | "account_put_deploy";
  params: any;
  id: 1;
}

export interface LiveResponseRoot<T> {
  data: T[];
  pageCount: number;
  itemCount: number;
  pages: { number: number; url: string }[];
}

export interface LTxnHistoryData {
  deploy_hash: string;
  block_hash: string;
  caller_public_key: string;
  execution_type_id: number;
  contract_hash?: any;
  contract_package_hash?: any;
  cost: string;
  payment_amount: string;
  error_message?: string;
  timestamp: string;
  status: string;
  args: {
    id: {
      parsed?: number;
      cl_type: {
        Option: string;
      };
    };
    amount: {
      parsed: string;
      cl_type: string;
    };
    target: {
      parsed: string;
      cl_type: {
        ByteArray: number;
      };
    };
  };
  amount: string;
}

export interface NodeResponseRoot<T> {
  jsonrpc: string;
  id: string;
  result: T;
}

export interface NNetworkStatusResponse {
  api_version: string;
  chainspec_name: string;
  starting_state_root_hash: string;
  peers: { node_id: string; address: string }[];
  last_added_block_info: {
    hash: string;
    timestamp: string;
    era_id: number;
    height: number;
    state_root_hash: string;
    creator: string;
  };
  our_public_signing_key: string;
  round_length?: any;
  next_upgrade?: any;
  build_version: string;
  uptime: string;
}

export interface NStateRootHashResponse {
  api_version: string;
  state_root_hash: string;
}

export interface NAccountBalance {
  api_version: string;
  balance_value: string;
  merkle_proof: string;
}

export interface NAccountInfo {
  api_version: string;
  account: {
    account_hash: string;
    named_keys: any[];
    main_purse: string;
    associated_keys: {
      account_hash: string;
      weight: number;
    }[];
    action_thresholds: {
      deployment: number;
      key_management: number;
    };
  };
  merkle_proof: string;
}

export interface NDeployMessagePutResponse {
  api_version: string;
  deploy_hash: string;
}

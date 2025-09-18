export interface IndexerResponseRoot<T> {
  data: T[];
  pageCount: number;
  itemCount: number;
  pages: { number: number; url: string }[];
}

export interface ITxnHistoryData {
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
      cl_type:
        | {
            ByteArray: number;
          }
        | string;
    };
  };
  amount: string;
}

export interface RpcError extends Error {
  statusCode: number;
}

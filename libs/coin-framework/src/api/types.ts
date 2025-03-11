export type BlockInfo = {
  height: number;
  hash?: string;
  time?: Date;
};

export type Operation = {
  type: string;
  // This operation corresponds to the index-th event triggered bu the original transaction
  operationIndex: number;
  senders: string[];
  recipients: string[];
  value: bigint;
  // Asset is not defined when dealing with native currency
  asset?: AssetInfo;
  // Field containing dedicated value for each blockchain
  details?: Record<string, unknown>;
  tx: {
    // One tx can trigger multiple operations, hence multiple operations with the same hash
    hash: string;
    // In which block this operation's related tx was included
    block: BlockInfo;
    fees: bigint;
  };
};

/*
  Examples :

  https://tronscan.org/#/token/1002000
  trc10
  {
    standard: "trc10",
    tokenId: "1002000",
  }
  
  https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
  trc20 
  {
    standard: "trc20",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  }

  https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
  erc20
  {
    standard: erc20,
    contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  }

  https://stellarchain.io/assets/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
  stellar USDC
  {
    standard: "asset_contract",
    tokenIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    tokenId: "USDC",
    contractAddress: "adefce59aee52968f76061d494c2525b75659fa4296a65f499ef29e56477e496"
  }
*/
export type AssetInfo = {
  standard: string;
  // ID / Code of the token
  tokenId?: string;
  // Address of the token's smart contract if there is one
  contractAddress?: string;
  // Account that deployed the token, even if it's a native token implementation or a smart contract
  tokenIssuer?: string;
};

export type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
} & Record<string, unknown>; // Field containing dedicated value for each blockchain

// TODO add a `token: string` field to the pagination if we really need to support pagination (which is not the case for now)
export type Asset = {
  native: bigint;
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };
export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  craftTransaction: (address: string, transaction: Transaction, pubkey?: string) => Promise<string>;
  estimateFees: (addr: string, amount: bigint) => Promise<bigint>;
  getBalance: (address: string) => Promise<Asset | bigint>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>;
};

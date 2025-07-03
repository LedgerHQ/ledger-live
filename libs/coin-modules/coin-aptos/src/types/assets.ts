export type AptosTokenInformation = {
  type: string;
  contractAddress: string;
};

export type AptosExtra = Record<string, unknown>;

export type AptosFeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};

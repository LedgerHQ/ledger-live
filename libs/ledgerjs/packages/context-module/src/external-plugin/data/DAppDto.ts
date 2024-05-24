export interface DAppDto {
  b2c: B2c;
  abis: Abis;
  b2c_signatures: B2cSignatures;
}

export interface B2c {
  blockchainName: string;
  chainId: number;
  contracts: Contract[];
  name: string;
}

interface Contract {
  address: string;
  contractName: string;
  selectors: { [selector: string]: ContractSelector };
}

interface ContractSelector {
  erc20OfInterest: string[];
  method: string;
  plugin: string;
}

export interface Abis {
  [address: string]: object[];
}

export interface B2cSignatures {
  [address: string]: {
    [selector: string]: B2cSignature;
  };
}

interface B2cSignature {
  plugin: string;
  serialized_data: string;
  signature: string;
}

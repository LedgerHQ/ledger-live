export type EIP712MessageDomain = Partial<{
  name: string;
  chainId: number;
  version: string;
  verifyingContract: string;
  salt: string;
}>;

export type EIP712MessageTypesEntry = {
  name: string;
  type: string;
};

export type EIP712MessageTypes = {
  EIP712Domain: EIP712MessageTypesEntry[];
  [key: string]: EIP712MessageTypesEntry[];
};

export type EIP712Message = {
  domain: EIP712MessageDomain;
  types: EIP712MessageTypes;
  primaryType: string;
  message: Record<string, unknown>;
};

export type EIP191Message = string;

export type TypedEvmMessage =
  | {
      standard: "EIP191";
      message: EIP191Message;
    }
  | {
      standard: "EIP712";
      message: EIP712Message;
      domainHash: string;
      hashStruct: string;
    };

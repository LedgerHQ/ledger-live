export type EIP712Message = {
  domain: EIP712MessageDomain;
  types: EIP712MessageTypes;
  primaryType: string;
  message: Record<string, unknown>;
};

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

export type StructDefData = Required<
  | {
      structType: "name";
      value: string;
    }
  | {
      structType: "field";
      value: Buffer;
    }
>;

export type StructImplemData = Required<
  | {
      structType: "root";
      value: string;
    }
  | {
      structType: "array";
      value: number;
    }
  | {
      structType: "field";
      value: Required<{
        data: unknown;
        type: string;
        sizeInBits: number | undefined;
      }>;
    }
>;

export type MessageFilters = {
  contractName: {
    label: string;
    signature: string;
  };
  fields: {
    label: string;
    path: string;
    signature: string;
  }[];
};

export type FilteringInfoShowField = {
  displayName: string;
  sig: string;
  filtersCount?: never;
};

export type FilteringInfoContractName = {
  displayName: string;
  sig: string;
  filtersCount: number;
};

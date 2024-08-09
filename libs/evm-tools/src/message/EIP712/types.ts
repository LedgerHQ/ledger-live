export type FieldFiltersV1 = {
  label: string;
  path: string;
  signature: string;
  format?: never;
  coin_ref?: never;
};

export type FieldFiltersV2 = {
  format: "raw" | "token" | "amount" | "datetime";
  label: string;
  path: string;
  signature: string;
} & (
  | {
      format: "raw" | "datetime";
      coin_ref?: never;
    }
  | {
      format: "token" | "amount";
      coin_ref: number;
    }
);

export type MessageFilters = {
  contractName: {
    label: string;
    signature: string;
  };
  fields: FieldFiltersV1[] | FieldFiltersV2[];
};

export type CALServiceEIP712Response = {
  eip712_signatures: {
    [contractAddress: string]: { [schemaHash: string]: MessageFilters };
  };
}[];

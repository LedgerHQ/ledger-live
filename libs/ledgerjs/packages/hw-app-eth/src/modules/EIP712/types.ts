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

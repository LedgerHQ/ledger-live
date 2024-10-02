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

export type FilteringInfoShowField = {
  displayName: string;
  sig: string;
  filtersCount?: never;
  chainId: number;
  erc20SignaturesBlob: string | null | undefined;
  format: "raw" | "token" | "amount" | "datetime" | undefined;
  coinRef: number | undefined;
  shouldUseV1Filters: boolean | undefined;
  coinRefsTokensMap: Record<
    number,
    {
      token: string;
      // Index of the token in the nano app memory
      // returned as a prefix by the APDU of
      // provideErc20TokenInformation
      deviceTokenIndex?: number;
    }
  >;
  isDiscarded: boolean;
};
export type FilteringInfoDiscardField = {
  path: string;
};

export type FilteringInfoContractName = {
  displayName: string;
  sig: string;
  filtersCount: number;
};

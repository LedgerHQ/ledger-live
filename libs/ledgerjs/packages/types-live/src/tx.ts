export type Transaction<
  AssetType extends Record<string, unknown>,
  OperationType extends Operation<AssetType>,
  DetailsType extends Record<string, unknown>,
> = {
  hash: string;
  value: bigint;
  failed: boolean;
  operations: OperationType[];
  details?: DetailsType;
};

export type Operation<AssetType> = Transfer<AssetType> | Fee<AssetType>;

export type Transfer<AssetType> = {
  type: "transfer";
  from: string;
  to: string;
  asset: AssetType;
};

export type Fee<AssetType> = {
  type: "fee";
  amount: bigint;
  asset: AssetType;
};

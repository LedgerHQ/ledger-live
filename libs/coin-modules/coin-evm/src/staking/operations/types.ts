export type OperationParams = {
  amount: bigint;
  valAddress?: string | undefined;
  valId?: string | undefined;
  dstValAddress?: string | undefined;
  delegator?: string | undefined;
};

export type OperationParamsWithValAddress = OperationParams & {
  valAddress: string;
};

export type OperationParamsWithValId = OperationParams & {
  valId: string;
};

export type OperationFn<P extends OperationParams = OperationParams> = (
  params: P,
) => Array<string | bigint>;

export type StakingProtocol<P extends OperationParams = OperationParams> = Record<
  string,
  OperationFn<P>
>;

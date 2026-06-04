export type TezosEarnFlow =
  | { kind: "no-funds" }
  | { kind: "earning-choice" }
  | { kind: "stake"; skipDelegation: boolean }
  | { kind: "delegate"; redelegate: boolean };

export type TezosEarnFlowInput = {
  isEmpty: boolean;
  stakingEnabled: boolean;
  isDelegated: boolean;
};

export function getTezosEarnFlow({
  isEmpty,
  stakingEnabled,
  isDelegated,
}: TezosEarnFlowInput): TezosEarnFlow {
  if (isEmpty) return { kind: "no-funds" };
  if (!stakingEnabled) return { kind: "delegate", redelegate: isDelegated };
  return isDelegated ? { kind: "stake", skipDelegation: true } : { kind: "earning-choice" };
}

export type TezosOperationMode =
  | "send"
  | "delegate"
  | "undelegate"
  | "stake"
  | "unstake"
  | "finalize_unstake"
  | "send_token";

type CapacityStatus = "normal" | "full";

export type Baker = {
  address: string;
  name: string;
  logoURL: string;
  nominalYield: `${number} %`;
  capacityStatus: CapacityStatus;
};

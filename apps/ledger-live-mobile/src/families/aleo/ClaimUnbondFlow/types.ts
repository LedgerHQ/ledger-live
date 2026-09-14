import { ScreenName } from "~/const";

export type ClaimUnbondFlowParamList = {
  [ScreenName.AleoClaimUnbondSelectDevice]: {
    accountId: string;
    parentId?: string;
  };
};

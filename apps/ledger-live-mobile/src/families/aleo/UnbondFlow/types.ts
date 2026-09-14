import { ScreenName } from "~/const";

export type UnbondFlowParamList = {
  [ScreenName.AleoUnbondAmount]: {
    accountId: string;
    parentId?: string;
  };
};

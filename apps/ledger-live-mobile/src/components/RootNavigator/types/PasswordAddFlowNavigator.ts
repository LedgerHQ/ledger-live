import { ScreenName } from "~/const";

export type PasswordAddFlowParamList = {
  [ScreenName.PasswordAdd]: undefined;
  [ScreenName.ConfirmPassword]: {
    password?: string;
  };
};

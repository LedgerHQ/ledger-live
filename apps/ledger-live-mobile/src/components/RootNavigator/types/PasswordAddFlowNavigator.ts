import type { ProtectionSource } from "LLM/features/AppLock/types";
import { ScreenName } from "~/const";

type PasswordAddParams = Readonly<{ source: ProtectionSource }>;

export type PasswordAddFlowParamList = {
  [ScreenName.PasswordAdd]: PasswordAddParams;
  [ScreenName.ConfirmPassword]: PasswordAddParams;
};

export type LegacyPasswordAddFlowParamList = {
  [ScreenName.PasswordAdd]: undefined;
  [ScreenName.ConfirmPassword]: {
    password?: string;
  };
};

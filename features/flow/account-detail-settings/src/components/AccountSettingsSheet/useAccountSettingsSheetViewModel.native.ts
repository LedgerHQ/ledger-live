import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import {
  getAccountExplorerUrl,
  type AccountExplorerSource,
} from "../../logic/getAccountExplorerUrl";
import type { AccountSettingsSheetStep } from "./types.native";

export function useAccountSettingsSheetViewModel(account: AccountExplorerSource): Readonly<{
  step: AccountSettingsSheetStep;
  title: string;
  explorerUrl?: string;
  onShowMenu: () => void;
  onShowRemove: () => void;
}> {
  const { t } = useTranslation();
  const [step, setStep] = useState<AccountSettingsSheetStep>("menu");

  const onShowMenu = useCallback(() => setStep("menu"), []);
  const onShowRemove = useCallback(() => setStep("remove"), []);

  return {
    step,
    title: t("accountDetailSettings.title"),
    explorerUrl: getAccountExplorerUrl(account),
    onShowMenu,
    onShowRemove,
  };
}

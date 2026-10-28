import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { AccountSettingsDialogStep } from "./types";

export function useAccountSettingsDialogViewModel(ticker: string): Readonly<{
  step: AccountSettingsDialogStep;
  title: string;
  changeNameTitle: string;
  changeNameDescription: string;
  advancedLogsTitle: string;
  onShowMenu: () => void;
  onShowChangeName: () => void;
  onShowAdvancedLogs: () => void;
  onShowRemove: () => void;
}> {
  const { t } = useTranslation();
  const [step, setStep] = useState<AccountSettingsDialogStep>("menu");

  const onShowMenu = useCallback(() => setStep("menu"), []);
  const onShowChangeName = useCallback(() => setStep("changeName"), []);
  const onShowAdvancedLogs = useCallback(() => setStep("advancedLogs"), []);
  const onShowRemove = useCallback(() => setStep("remove"), []);

  return {
    step,
    title: t("accountDetailSettings.title"),
    changeNameTitle: t("accountDetailSettings.changeName.title"),
    changeNameDescription: t("accountDetailSettings.changeName.description", { ticker }),
    advancedLogsTitle: t("accountDetailSettings.advancedLogs.title"),
    onShowMenu,
    onShowChangeName,
    onShowAdvancedLogs,
    onShowRemove,
  };
}

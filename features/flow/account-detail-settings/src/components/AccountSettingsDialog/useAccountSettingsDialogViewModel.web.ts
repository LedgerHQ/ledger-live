import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { AccountSettingsDialogStep } from "./types.web";

export function useAccountSettingsDialogViewModel(ticker: string): Readonly<{
  step: AccountSettingsDialogStep;
  title: string;
  changeNameTitle: string;
  changeNameDescription: string;
  onShowMenu: () => void;
  onShowChangeName: () => void;
  onShowRemove: () => void;
}> {
  const { t } = useTranslation();
  const [step, setStep] = useState<AccountSettingsDialogStep>("menu");

  const onShowMenu = useCallback(() => setStep("menu"), []);
  const onShowChangeName = useCallback(() => setStep("changeName"), []);
  const onShowRemove = useCallback(() => setStep("remove"), []);

  return {
    step,
    title: t("accountDetailSettings.title"),
    changeNameTitle: t("accountDetailSettings.changeName.title"),
    changeNameDescription: t("accountDetailSettings.changeName.description", { ticker }),
    onShowMenu,
    onShowChangeName,
    onShowRemove,
  };
}

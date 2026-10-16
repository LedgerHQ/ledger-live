import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { AccountSettingsDialogStep } from "./types.web";

export function useAccountSettingsDialogViewModel(): Readonly<{
  step: AccountSettingsDialogStep;
  title: string;
  onShowMenu: () => void;
  onShowRemove: () => void;
}> {
  const { t } = useTranslation();
  const [step, setStep] = useState<AccountSettingsDialogStep>("menu");

  const onShowMenu = useCallback(() => setStep("menu"), []);
  const onShowRemove = useCallback(() => setStep("remove"), []);

  return { step, title: t("accountDetailSettings.title"), onShowMenu, onShowRemove };
}

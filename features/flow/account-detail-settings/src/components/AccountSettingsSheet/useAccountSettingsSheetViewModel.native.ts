import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { AccountSettingsSheetStep } from "./types.native";

export function useAccountSettingsSheetViewModel(): Readonly<{
  step: AccountSettingsSheetStep;
  title: string;
  onShowMenu: () => void;
  onShowRemove: () => void;
}> {
  const { t } = useTranslation();
  const [step, setStep] = useState<AccountSettingsSheetStep>("menu");

  const onShowMenu = useCallback(() => setStep("menu"), []);
  const onShowRemove = useCallback(() => setStep("remove"), []);

  return { step, title: t("accountDetailSettings.title"), onShowMenu, onShowRemove };
}

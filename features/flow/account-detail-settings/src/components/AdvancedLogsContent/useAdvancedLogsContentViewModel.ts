import { useCallback, useMemo } from "react";
import { copyToClipboard } from "@shared/clipboard";
import { useTranslation } from "@shared/i18n";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import type { AdvancedLogsContentProps, AdvancedLogsContentViewProps } from "./types";

export function useAdvancedLogsContentViewModel({
  input,
  locale,
  derivationTag,
  onCopied,
}: AdvancedLogsContentProps): AdvancedLogsContentViewProps {
  const { t } = useTranslation();
  const { json, syncDate } = useMemo(() => buildAdvancedLogs(input, locale), [input, locale]);

  const onCopy = useCallback(async () => {
    const copied = await copyToClipboard(json);
    onCopied?.(copied);
  }, [json, onCopied]);

  return {
    derivationTip: derivationTag
      ? t("accountDetailSettings.advancedLogs.derivationTip", { tag: derivationTag })
      : undefined,
    synchronised: t("accountDetailSettings.advancedLogs.synchronised", { date: syncDate }),
    json,
    copyLabel: t("accountDetailSettings.advancedLogs.copy"),
    onCopy,
  };
}

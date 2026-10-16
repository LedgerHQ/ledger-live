import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyToClipboard } from "@shared/clipboard";
import { useTranslation } from "@shared/i18n";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import type { AdvancedLogsContentProps, AdvancedLogsContentViewProps } from "./types";

const COPIED_FEEDBACK_DURATION_MS = 2000;

export function useAdvancedLogsContentViewModel({
  input,
  locale,
  derivationTag,
  onCopied,
}: AdvancedLogsContentProps): AdvancedLogsContentViewProps {
  const { t } = useTranslation();
  const { json, syncDate } = useMemo(() => buildAdvancedLogs(input, locale), [input, locale]);
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const onCopy = useCallback(async () => {
    const copied = await copyToClipboard(json);
    onCopied?.(copied);
    if (!copied) return;
    clearTimeout(resetTimer.current);
    setIsCopied(true);
    resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_DURATION_MS);
  }, [json, onCopied]);

  return {
    derivationTip: derivationTag
      ? t("accountDetailSettings.advancedLogs.derivationTip", { tag: derivationTag })
      : undefined,
    synchronised: t("accountDetailSettings.advancedLogs.synchronised", { date: syncDate }),
    json,
    copyLabel: isCopied
      ? t("accountDetailSettings.advancedLogs.copied")
      : t("accountDetailSettings.advancedLogs.copy"),
    isCopied,
    onCopy,
  };
}

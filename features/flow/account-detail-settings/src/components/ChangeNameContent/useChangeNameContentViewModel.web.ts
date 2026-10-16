import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { ChangeNameContentProps, ChangeNameContentViewProps } from "./types.web";

const normalize = (name: string) => name.replace(/\s+/g, " ").trim();

export function useChangeNameContentViewModel({
  initialName,
  maxLength,
  isDisabled = false,
  onConfirm,
}: ChangeNameContentProps): ChangeNameContentViewProps {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialName);
  const normalizedValue = normalize(value);
  const isSubmitDisabled =
    isDisabled || normalizedValue.length === 0 || normalizedValue === normalize(initialName);

  const onClear = useCallback(() => setValue(""), []);
  const onSubmit = useCallback(() => {
    if (isSubmitDisabled) return;
    onConfirm(normalizedValue);
  }, [isSubmitDisabled, normalizedValue, onConfirm]);

  return {
    value,
    maxLength,
    label: t("accountDetailSettings.changeName.label"),
    submitLabel: t("accountDetailSettings.changeName.submit"),
    isSubmitDisabled,
    onChange: setValue,
    onClear,
    onSubmit,
  };
}

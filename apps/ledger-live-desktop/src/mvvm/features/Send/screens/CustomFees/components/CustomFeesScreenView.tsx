import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput, Button } from "@ledgerhq/lumen-ui-react";
import type { CustomFeeInputState } from "./hooks/useCustomFeesViewModel";

type CustomFeesScreenViewProps = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
}>;

export function CustomFeesScreenView({
  inputs,
  fiatLabel,
  fiatValue,
  isConfirmDisabled,
  onInputChange,
  onInputClear,
  onConfirm,
}: CustomFeesScreenViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-24">
        <div className="flex flex-col gap-16">
          {inputs.map(input => (
            <div key={input.key} className="flex flex-col gap-4">
              <TextInput
                label={input.label}
                value={input.value}
                onChange={e => onInputChange(input.key, e.target.value)}
                onClear={() => onInputClear(input.key)}
                aria-invalid={input.error !== null}
                errorMessage={input.error ?? undefined}
                inputMode="decimal"
                autoComplete="off"
              />
              {input.suggestedRange ? (
                <div className="flex items-center justify-between px-4">
                  <span className="body-3 text-muted">{t("newSendFlow.customFees.suggested")}</span>
                  <span className="body-3 text-base">
                    {input.suggestedRange.min}-{input.suggestedRange.max}
                  </span>
                </div>
              ) : null}
              {input.helperLabel && input.helperValue ? (
                <div className="flex items-center justify-between px-4">
                  <span className="body-3 text-muted">{input.helperLabel}</span>
                  <span className="body-3 text-base">{input.helperValue}</span>
                </div>
              ) : null}
            </div>
          ))}
          {fiatLabel && fiatValue ? (
            <div className="flex items-center justify-between px-4 pt-8">
              <span className="body-3 text-muted">{fiatLabel}</span>
              <span className="body-3 text-base">{fiatValue}</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-56 pt-12">
        <Button
          appearance="base"
          size="lg"
          isFull
          onClick={onConfirm}
          disabled={isConfirmDisabled}
          className="rounded-full"
        >
          {t("newSendFlow.customFees.confirm")}
        </Button>
      </div>
    </div>
  );
}

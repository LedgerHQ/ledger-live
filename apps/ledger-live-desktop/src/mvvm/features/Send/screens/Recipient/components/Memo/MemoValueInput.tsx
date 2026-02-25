import React, { useCallback } from "react";
import { TextInput, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { useTranslatedBridgeError } from "../../hooks/useTranslatedBridgeError";

type MemoValueInputProps = Readonly<{
  currencyId: string;
  value: string;
  maxLength?: number;
  /** When "tag", input is restricted to digits only (ex XRP, Casper). */
  memoType?: string;
  /** Max numeric value when memoType is "tag" (ex XRP UINT32_MAX). */
  memoMaxValue?: number;
  /** Full error for correct i18n interpolation (ex Casper maxTransferId). */
  transactionError?: Error;
  /** Fallback when transactionError is not passed (no interpolation). */
  transactionErrorName?: string;
  onChange: (value: string) => void;
}>;

function MemoValueInputComponent({
  currencyId,
  value,
  maxLength,
  memoType,
  memoMaxValue,
  transactionError,
  transactionErrorName,
  onChange,
}: MemoValueInputProps) {
  const { t } = useTranslation();
  const translatedError = useTranslatedBridgeError(transactionError);
  const memoLabel = t([`families.${currencyId}.memo`, "common.memo"]);
  const errorMessage =
    translatedError?.title ??
    (transactionErrorName ? t(`errors.${transactionErrorName}.title`) : undefined);

  const isTagType = memoType === "tag";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let next = e.target.value;
      if (isTagType) {
        next = next.replace(/\D/g, "");
        if (memoMaxValue != null && next !== "") {
          const num = Number(next);
          if (num > memoMaxValue) next = String(memoMaxValue);
        }
      }
      onChange(next);
    },
    [isTagType, memoMaxValue, onChange],
  );

  return (
    <TextInput
      label={t("newSendFlow.tagHelp.inputLabel", { memoLabel })}
      onChange={handleChange}
      inputMode={isTagType ? "numeric" : "text"}
      suffix={
        <Tooltip>
          <TooltipTrigger asChild>
            <Information size={20} />
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-h-[160px] max-w-256 text-center">
              {t("newSendFlow.tagHelp.description", {
                currency: currencyId,
                memoLabel,
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      }
      className="w-full"
      value={value}
      maxLength={isTagType ? undefined : maxLength}
      errorMessage={errorMessage}
    />
  );
}

export const MemoValueInput = React.memo(MemoValueInputComponent);

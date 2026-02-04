import React from "react";
import { TextInput, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

type MemoValueInputProps = Readonly<{
  currencyId: string;
  value: string;
  maxLength?: number;
  transactionErrorName?: string;
  onChange: (value: string) => void;
}>;

function MemoValueInputComponent({
  currencyId,
  value,
  maxLength,
  transactionErrorName,
  onChange,
}: MemoValueInputProps) {
  const { t } = useTranslation();
  const memoLabel = t([`families.${currencyId}.memo`, "common.memo"]);
  const errorMessage = transactionErrorName ? t(`errors.${transactionErrorName}.title`) : undefined;

  return (
    <TextInput
      data-testid="send-memo-input"
      label={t("newSendFlow.tagHelp.inputLabel", { memoLabel })}
      onChange={e => onChange(e.target.value)}
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
      maxLength={maxLength}
      errorMessage={errorMessage}
    />
  );
}

export const MemoValueInput = React.memo(MemoValueInputComponent);

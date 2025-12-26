import React from "react";
import { TextInput, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { t } from "i18next";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type GenericMemoInputProps = {
  currency: CryptoCurrency | TokenCurrency;
  onChange: (value: string) => void;
};

export default function GenericMemoInput({ currency, onChange }: GenericMemoInputProps) {
  return (
    <TextInput
      label={t("newSendFlow.tagHelp.inputLabel", {
        memoLabel: t("families." + currency.id + ".memo", "common.memo"),
      })}
      onChange={e => onChange(e.target.value)}
      suffix={
        <Tooltip>
          <TooltipTrigger asChild>
            <Information size={20} />
          </TooltipTrigger>
          <TooltipContent>{t("newSendFlow.tagHelp.description")}</TooltipContent>
        </Tooltip>
      }
      className="mt-12 w-full"
    />
  );
}

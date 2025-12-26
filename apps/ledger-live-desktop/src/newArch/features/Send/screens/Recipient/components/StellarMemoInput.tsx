import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { t } from "i18next";
import invariant from "invariant";
import React, { useCallback, useState } from "react";

type StellarMemoInputProps = {
  currency: CryptoCurrency | TokenCurrency;
  onChange: (value: string, type: string) => void;
};

export default function StellarMemoInput({ currency, onChange }: StellarMemoInputProps) {
  const memoTypeOptions = sendFeatures.getMemoOptions(currency);
  invariant(memoTypeOptions, "Stellar must have different type options");

  const [memoType, setMemoType] = useState("MEMO_TEXT");
  const onMemoTypeOptionChange = useCallback((value: string) => {
    setMemoType(value);
  }, []);

  const onMemoInputChange = useCallback(
    (value: string) => {
      onChange(value, memoType);
    },
    [memoType, onChange],
  );

  return (
    <>
      <Select onValueChange={onMemoTypeOptionChange} value={memoType}>
        <SelectTrigger />
        <SelectContent>
          {memoTypeOptions.map((value, key) => {
            return (
              <SelectItem key={key} value={value}>
                <SelectItemText>{t("families.stellar.memoType." + value)}</SelectItemText>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {memoType !== "NO_MEMO" && (
        <TextInput
          label={t("newSendFlow.tagHelp.inputLabel", {
            memoLabel: t("families." + currency.id + ".memo", "common.memo"),
          })}
          onChange={e => onMemoInputChange(e.target.value)}
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
      )}
    </>
  );
}

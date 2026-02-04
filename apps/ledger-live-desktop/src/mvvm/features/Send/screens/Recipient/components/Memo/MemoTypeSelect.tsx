import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

type MemoTypeSelectProps = Readonly<{
  currencyId: string;
  options: readonly string[];
  value?: string;
  onChange: (value: string) => void;
}>;

function MemoTypeSelectComponent({ currencyId, options, value, onChange }: MemoTypeSelectProps) {
  const { t } = useTranslation();

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger data-testid="send-memo-options-select" />
      <SelectContent>
        {options.map(optionValue => (
          <SelectItem key={optionValue} value={optionValue}>
            <SelectItemText data-testid={`send-memo-select-option-${optionValue}`}>
              {t(`families.${currencyId}.memoType.${optionValue}`)}
            </SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const MemoTypeSelect = React.memo(MemoTypeSelectComponent);

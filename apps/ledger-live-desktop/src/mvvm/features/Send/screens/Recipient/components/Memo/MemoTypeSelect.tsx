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
    <div data-testid="stellar-memo-dropdown">
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger data-testid="stellar-memo-dropdown-trigger" aria-label="Memo type" />
        <SelectContent data-testid="stellar-memo-dropdown-content">
          {options.map(optionValue => (
            <SelectItem
              key={optionValue}
              value={optionValue}
              data-testid={`stellar-memo-option-${optionValue.toLowerCase().replace("_", "-")}`}
            >
              <SelectItemText>{t(`families.${currencyId}.memoType.${optionValue}`)}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const MemoTypeSelect = React.memo(MemoTypeSelectComponent);

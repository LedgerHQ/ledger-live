import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
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

  const items = useMemo(
    () =>
      options.map(optionValue => ({
        value: optionValue,
        label: t(`families.${currencyId}.memoType.${optionValue}`),
      })),
    [currencyId, options, t],
  );

  return (
    <Select
      items={items}
      onValueChange={v => {
        if (v != null) onChange(v);
      }}
      value={value ?? null}
    >
      <SelectTrigger data-testid="send-memo-options-select" />
      <SelectContent>
        <SelectList
          renderItem={item => (
            <SelectItem
              key={item.value}
              value={item.value}
              data-testid={`send-memo-select-option-${item.value}`}
            >
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
}

export const MemoTypeSelect = React.memo(MemoTypeSelectComponent);

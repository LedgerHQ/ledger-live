import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderAction,
  Link,
} from "@ledgerhq/lumen-ui-react";
import type { PickingStrategyOption } from "../hooks/useBitcoinUtxoDisplayData";

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly PickingStrategyOption[];
  value: string;
}>;

export const StrategySelect = ({ onValueChange, options, value }: StrategySelectProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow className="px-8">
          <SubheaderTitle>Strategy</SubheaderTitle>
          <SubheaderAction onClick={() => {}}>
            <Link href="#" appearance="accent" underline={false} size="md">
              Learn more
            </Link>
          </SubheaderAction>
        </SubheaderRow>
      </Subheader>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger />
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={String(option.value)}>
              <SelectItemText>{t(option.labelKey)}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

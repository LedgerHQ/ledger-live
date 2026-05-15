import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import { useEvmNetworks, type EvmNetwork } from "../hooks/useEvmNetworks";

type Props = {
  label: string;
  /** Currency id (e.g. "ethereum"). Null = nothing selected. */
  value: string | null;
  onChange: (network: EvmNetwork) => void;
  disabled?: boolean;
};

const NetworkSelect = ({ label, value, onChange, disabled }: Props) => {
  const networks = useEvmNetworks();
  const items = networks.map(n => ({ value: n.id, label: n.name }));

  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={next => {
        const picked = networks.find(n => n.id === next);
        if (picked) onChange(picked);
      }}
    >
      <SelectTrigger label={label} />
      <SelectContent>
        <SelectList
          renderItem={item => (
            <SelectItem key={item.value} value={item.value}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
};

export default NetworkSelect;

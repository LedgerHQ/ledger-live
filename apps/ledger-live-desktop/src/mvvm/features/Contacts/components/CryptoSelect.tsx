import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import { TOP_CRYPTOS, type CryptoOption } from "../constants/topCryptos";

type Props = {
  label: string;
  /** Crypto id (e.g. "ethereum"). Null = nothing selected. */
  value: string | null;
  onChange: (crypto: CryptoOption) => void;
  disabled?: boolean;
};

/**
 * Crypto picker shown above the Network selector in the L1
 * `RegisterExternalAddress` form. Demo-only: the user's selection is
 * captured in form state but NOT persisted to `ContactEntry` (its
 * schema is frozen at the DMK shape — see `topCryptos.ts`).
 *
 * Visually mirrors `NetworkSelect` for consistency. Items rendered as
 * `"{Name} ({TICKER})"` so the user can find a crypto by either name
 * or ticker as they scroll.
 */
const CryptoSelect = ({ label, value, onChange, disabled }: Props) => {
  const items = TOP_CRYPTOS.map(c => ({
    value: c.id,
    label: `${c.name} (${c.ticker})`,
  }));

  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={next => {
        const picked = TOP_CRYPTOS.find(c => c.id === next);
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

export default CryptoSelect;

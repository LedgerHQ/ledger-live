import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { NetworkOption } from "../constants/networks";

/**
 * Presentational network picker. The caller owns the list — for the
 * Ledger-account form it's the EVM-only list from `useEvmNetworks()`,
 * for the External-address form it's the crypto-filtered list from
 * `utils/getNetworksForCrypto.ts`.
 *
 * Generic on `N` so consumers that store the richer `EvmNetwork`
 * (chainId is always defined) don't have to narrow on the way back
 * from `onChange`.
 */
type Props<N extends NetworkOption> = {
  label: string;
  /** The list to render. Order is preserved. */
  networks: N[];
  /** Currency id (e.g. "ethereum"). Null = nothing selected. */
  value: string | null;
  onChange: (network: N) => void;
  disabled?: boolean;
};

function NetworkSelect<N extends NetworkOption>({
  label,
  networks,
  value,
  onChange,
  disabled,
}: Props<N>) {
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
}

export default NetworkSelect;

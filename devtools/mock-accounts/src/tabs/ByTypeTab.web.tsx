import React from "react";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
} from "@ledgerhq/lumen-ui-react";
import type { ByTypeSectionViewModel } from "../hooks/useByTypeSectionViewModel";

interface Props {
  vm: ByTypeSectionViewModel;
  stocksLoading: boolean;
  stablecoinsLoading: boolean;
}

const TYPE_ROWS = [
  { key: "cryptos", label: "Cryptos", desc: "Mainnet accounts (random currencies)" },
  {
    key: "stablecoins",
    label: "Stablecoins",
    desc: "1 account per network with stablecoin sub-accounts",
  },
  { key: "stocks", label: "Stocks", desc: "Tokenized stocks as sub-accounts" },
  { key: "testnets", label: "Testnets", desc: "Include testnet currencies in the pool" },
] as const;

export function ByTypeTab({ vm, stocksLoading, stablecoinsLoading }: Props) {
  const switchValues: Record<string, boolean> = {
    cryptos: vm.includeCryptos,
    stablecoins: vm.includeStablecoins,
    stocks: vm.includeStocks,
    testnets: vm.includeTestnet,
  };
  const switchHandlers: Record<string, (v: boolean) => void> = {
    cryptos: vm.onToggleCryptos,
    stablecoins: vm.setIncludeStablecoins,
    stocks: vm.setIncludeStocks,
    testnets: vm.onToggleTestnet,
  };

  return (
    <div className="flex flex-col gap-12 pt-4">
      <div className="flex flex-col">
        {TYPE_ROWS.map(({ key, label, desc }) => (
          <ListItem key={key}>
            <ListItemContent>
              <ListItemTitle>{label}</ListItemTitle>
              <ListItemDescription>{desc}</ListItemDescription>
            </ListItemContent>
            <ListItemTrailing>
              <Switch selected={switchValues[key]} onChange={switchHandlers[key]} />
            </ListItemTrailing>
          </ListItem>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <span className="body-4 text-muted">Count</span>
        <div className="w-fit">
          <SegmentedControl
            selectedValue={vm.countInput}
            onSelectedChange={vm.setCountInput}
            tabLayout="fit"
          >
            {(["1", "5", "10", "50"] as const).map(n => (
              <SegmentedControlButton key={n} value={n}>
                {n}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </div>
      </div>

      {!vm.isValid && <p className="body-4 text-error">Select at least one account type.</p>}
      {vm.includeStablecoins && stablecoinsLoading && (
        <p className="body-4 text-muted">Loading stablecoin data…</p>
      )}
      {vm.includeStocks && stocksLoading && (
        <p className="body-4 text-muted">Loading stock data…</p>
      )}

      <Button appearance="gray" size="sm" disabled={!vm.isReady} onClick={vm.onGenerate}>
        Generate by type
      </Button>
    </div>
  );
}

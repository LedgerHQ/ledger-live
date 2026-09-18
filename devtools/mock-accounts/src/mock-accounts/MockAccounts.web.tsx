import React, { useState, useCallback } from "react";
import {
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
} from "@ledgerhq/lumen-ui-react";
import type { MockAccountsToolProps } from "../types";
import { useByTypeSectionViewModel } from "../hooks/useByTypeSectionViewModel";
import { useByCurrencySectionViewModel } from "../hooks/useByCurrencySectionViewModel";
import { RandomTab } from "../tabs/RandomTab";
import { ByCurrencyTab } from "../tabs/ByCurrencyTab";
import { ByTypeTab } from "../tabs/ByTypeTab";

type Tab = "random" | "by-currency" | "by-type";

export default function MockAccounts({
  generateRandom,
  generateByCurrency,
  generateByType,
  generateEmpty,
  clearAccounts,
  stocksLoading,
  stablecoinsLoading,
}: Readonly<MockAccountsToolProps>) {
  const [tab, setTab] = useState<Tab>("random");

  const handleRandom = useCallback(
    (count: number) => {
      if (!window.confirm("This will erase existing accounts. Continue?")) return;
      void generateRandom(count);
    },
    [generateRandom],
  );

  const handleClear = useCallback(() => {
    if (!window.confirm("This will erase all accounts. Continue?")) return;
    clearAccounts();
  }, [clearAccounts]);

  const byCurrencyVm = useByCurrencySectionViewModel({
    onGenerateByCurrency: useCallback(
      opts => {
        if (!window.confirm("This will erase existing accounts. Continue?")) return;
        void generateByCurrency(opts);
      },
      [generateByCurrency],
    ),
    onGenerateEmpty: useCallback(
      opts => {
        if (!window.confirm("This will erase existing accounts. Continue?")) return;
        void generateEmpty(opts);
      },
      [generateEmpty],
    ),
  });

  const byTypeVm = useByTypeSectionViewModel({
    onGenerate: useCallback(
      opts => {
        if (!window.confirm("This will erase existing accounts. Continue?")) return;
        return generateByType(opts);
      },
      [generateByType],
    ),
    stocksLoading,
    stablecoinsLoading,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-16 pt-12 pb-8">
        <div className="w-fit">
          <SegmentedControl
            selectedValue={tab}
            onSelectedChange={v => setTab(v as Tab)}
            tabLayout="fit"
          >
            <SegmentedControlButton value="random">Random</SegmentedControlButton>
            <SegmentedControlButton value="by-currency">By currency</SegmentedControlButton>
            <SegmentedControlButton value="by-type">By type</SegmentedControlButton>
          </SegmentedControl>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-16 pb-16">
        {tab === "random" && <RandomTab onGenerate={handleRandom} />}
        {tab === "by-currency" && <ByCurrencyTab vm={byCurrencyVm} />}
        {tab === "by-type" && (
          <ByTypeTab
            vm={byTypeVm}
            stocksLoading={stocksLoading}
            stablecoinsLoading={stablecoinsLoading}
          />
        )}
      </div>

      <Divider />
      <div className="px-16 py-8">
        <Button appearance="red" size="sm" onClick={handleClear}>
          Clear all accounts
        </Button>
      </div>
    </div>
  );
}

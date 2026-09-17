import { useState, useCallback } from "react";
import { Alert as RNAlert, ScrollView, View } from "react-native";
import {
  Box,
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
} from "@ledgerhq/lumen-ui-rnative";
import type { MockAccountsToolProps } from "../types";
import { useByTypeSectionViewModel } from "../hooks/useByTypeSectionViewModel";
import { useByCurrencySectionViewModel } from "../hooks/useByCurrencySectionViewModel";
import { RandomTab } from "../tabs/RandomTab";
import { ByCurrencyTab } from "../tabs/ByCurrencyTab";
import { ByTypeTab } from "../tabs/ByTypeTab";

type Tab = "random" | "by-currency" | "by-type";

function withConfirm(msg: string, onConfirm: () => void, onCancel?: () => void) {
  RNAlert.alert("Confirm", msg, [
    { text: "Cancel", style: "cancel", onPress: onCancel },
    { text: "OK", onPress: onConfirm },
  ]);
}

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
      withConfirm("This will erase existing accounts. Continue?", () => {
        void generateRandom(count);
      });
    },
    [generateRandom],
  );

  const handleClear = useCallback(() => {
    withConfirm("This will erase all accounts. Continue?", () => {
      clearAccounts();
    });
  }, [clearAccounts]);

  const byCurrencyVm = useByCurrencySectionViewModel({
    onGenerateByCurrency: useCallback(
      opts =>
        new Promise<void>((resolve, reject) => {
          withConfirm(
            "This will erase existing accounts. Continue?",
            () => {
              resolve();
              void generateByCurrency(opts);
            },
            reject,
          );
        }),
      [generateByCurrency],
    ),
    onGenerateEmpty: useCallback(
      opts =>
        new Promise<void>((resolve, reject) => {
          withConfirm(
            "This will erase existing accounts. Continue?",
            () => {
              resolve();
              void generateEmpty(opts);
            },
            reject,
          );
        }),
      [generateEmpty],
    ),
  });

  const byTypeVm = useByTypeSectionViewModel({
    onGenerate: useCallback(
      opts =>
        new Promise<void>((resolve, reject) => {
          withConfirm(
            "This will erase existing accounts. Continue?",
            () => {
              resolve();
              void generateByType(opts);
            },
            reject,
          );
        }),
      [generateByType],
    ),
    stocksLoading,
    stablecoinsLoading,
  });

  return (
    <View style={{ flex: 1 }}>
      <Box lx={{ padding: "s16", paddingBottom: "s8" }}>
        <SegmentedControl
          selectedValue={tab}
          onSelectedChange={v => setTab(v as Tab)}
          tabLayout="fit"
        >
          <SegmentedControlButton value="random">Random</SegmentedControlButton>
          <SegmentedControlButton value="by-currency">By currency</SegmentedControlButton>
          <SegmentedControlButton value="by-type">By type</SegmentedControlButton>
        </SegmentedControl>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {tab === "random" && <RandomTab onGenerate={handleRandom} />}
        {tab === "by-currency" && <ByCurrencyTab vm={byCurrencyVm} />}
        {tab === "by-type" && (
          <ByTypeTab
            vm={byTypeVm}
            stocksLoading={stocksLoading}
            stablecoinsLoading={stablecoinsLoading}
          />
        )}
      </ScrollView>

      <Divider />
      <Box lx={{ padding: "s16", paddingVertical: "s8" }}>
        <Button appearance="red" size="sm" onPress={handleClear}>
          Clear all accounts
        </Button>
      </Box>
    </View>
  );
}

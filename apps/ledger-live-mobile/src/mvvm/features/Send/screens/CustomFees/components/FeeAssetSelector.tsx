import React, { useCallback, useMemo } from "react";
import {
  Box,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  OptionList,
  OptionListContent,
  OptionListItem,
  OptionListItemContent,
  OptionListItemDescription,
  OptionListItemLeading,
  OptionListItemText,
  OptionListTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import type { OptionListItemData } from "@ledgerhq/lumen-ui-rnative";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FeeAssetUiOption } from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import CurrencyIcon from "~/components/CurrencyIcon";

type FeeAssetSelectorProps = Readonly<{
  options: readonly FeeAssetUiOption[];
  selectedId: string;
  onChange: (id: string) => void;
  payFeesInLabel: string;
}>;

type FeeAssetMeta = Readonly<{
  currency: CryptoOrTokenCurrency | undefined;
  formattedBalance: string | undefined;
}>;

type FeeAssetListItem = OptionListItemData<string, FeeAssetMeta>;

export function FeeAssetSelector({
  options,
  selectedId,
  onChange,
  payFeesInLabel,
}: FeeAssetSelectorProps) {
  const bottomSheetRef = useBottomSheetRef();

  const items = useMemo<FeeAssetListItem[]>(
    () =>
      options.map(option => ({
        value: option.id,
        label: option.ticker,
        meta: {
          currency: option.currency,
          formattedBalance: option.formattedBalance,
        },
      })),
    [options],
  );

  const selectedOption = useMemo(
    () => options.find(option => option.id === selectedId),
    [options, selectedId],
  );

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, [bottomSheetRef]);

  const handleValueChange = useCallback(
    (newValue: string | null) => {
      if (newValue != null) {
        onChange(newValue);
        bottomSheetRef.current?.dismiss();
      }
    },
    [bottomSheetRef, onChange],
  );

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  return (
    <Box lx={{ flexDirection: "column", gap: "s12" }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{payFeesInLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <OptionListTrigger onPress={handleOpenSheet}>
        {selectedOption != null && (
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
            {selectedOption.currency && (
              <CurrencyIcon currency={selectedOption.currency} size={16} />
            )}
            <Text lx={{ color: "base" }}>{selectedOption.ticker}</Text>
          </Box>
        )}
      </OptionListTrigger>
      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        snapPoints={null}
        onClose={handleCloseSheet}
      >
        <BottomSheetView>
          <BottomSheetHeader title={payFeesInLabel} />
          <OptionList items={items} value={selectedId || null} onValueChange={handleValueChange}>
            <OptionListContent<string, FeeAssetMeta>
              lx={{ marginBottom: "s24" }}
              renderItem={item => {
                const currency = item.meta?.currency;
                const formattedBalance = item.meta?.formattedBalance;
                return (
                  <OptionListItem value={item.value}>
                    {currency && (
                      <OptionListItemLeading testID={`send-fee-asset-icon-${item.value}`}>
                        <CurrencyIcon currency={currency} size={32} />
                      </OptionListItemLeading>
                    )}
                    <OptionListItemContent>
                      <OptionListItemText>{item.label}</OptionListItemText>
                      {formattedBalance !== undefined && (
                        <OptionListItemDescription testID={`send-fee-asset-balance-${item.value}`}>
                          {formattedBalance}
                        </OptionListItemDescription>
                      )}
                    </OptionListItemContent>
                  </OptionListItem>
                );
              }}
            />
          </OptionList>
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
}

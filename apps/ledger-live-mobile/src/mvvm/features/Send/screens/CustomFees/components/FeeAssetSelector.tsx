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
  OptionListItemText,
  OptionListTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import type { FeeAssetOption } from "@ledgerhq/live-common/bridge/descriptor/types";

type FeeAssetSelectorProps = Readonly<{
  options: readonly FeeAssetOption[];
  selectedId: string;
  onChange: (id: string) => void;
  payFeesInLabel: string;
}>;

export function FeeAssetSelector({
  options,
  selectedId,
  onChange,
  payFeesInLabel,
}: FeeAssetSelectorProps) {
  const bottomSheetRef = useBottomSheetRef();

  const items = useMemo(
    () => options.map(option => ({ value: option.id, label: option.ticker })),
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
        {selectedOption != null && <Text lx={{ color: "base" }}>{selectedOption.ticker}</Text>}
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
            <OptionListContent
              lx={{ marginBottom: "s24" }}
              renderItem={item => (
                <OptionListItem value={item.value}>
                  <OptionListItemContent>
                    <OptionListItemText>{item.label}</OptionListItemText>
                  </OptionListItemContent>
                </OptionListItem>
              )}
            />
          </OptionList>
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
}

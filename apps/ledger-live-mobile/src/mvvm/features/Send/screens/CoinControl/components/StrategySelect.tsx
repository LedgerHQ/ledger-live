import {
  Box,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  SelectList,
  SelectListContent,
  SelectListItem,
  SelectListItemContent,
  SelectListItemText,
  SelectListTrigger,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import React, { useCallback, useMemo } from "react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
}: StrategySelectProps) => {
  const bottomSheetRef = useBottomSheetRef();

  const items = useMemo(
    () => options.map(option => ({ value: String(option.value), label: option.label })),
    [options],
  );

  const selectedOption = useMemo(
    () => options.find(option => String(option.value) === value),
    [options, value],
  );

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, [bottomSheetRef]);

  const handleValueChange = useCallback(
    (newValue: string | null) => {
      if (newValue != null) {
        onValueChange(newValue);
        bottomSheetRef.current?.dismiss();
      }
    },
    [bottomSheetRef, onValueChange],
  );

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  return (
    <Box lx={{ flexDirection: "column", gap: "s12", paddingHorizontal: "s8" }}>
      <SelectListTrigger label={strategyLabel} onPress={handleOpenSheet}>
        {selectedOption != null && <Text lx={{ color: "base" }}>{selectedOption.label}</Text>}
      </SelectListTrigger>
      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        snapPoints={null}
        onClose={handleCloseSheet}
      >
        <BottomSheetView>
          <BottomSheetHeader title={strategyLabel} />
          <SelectList items={items} value={value || null} onValueChange={handleValueChange}>
            <SelectListContent
              lx={{ marginBottom: "s24" }}
              renderItem={item => (
                <SelectListItem value={item.value}>
                  <SelectListItemContent>
                    <SelectListItemText>{item.label}</SelectListItemText>
                  </SelectListItemContent>
                </SelectListItem>
              )}
            />
          </SelectList>
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};

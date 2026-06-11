import {
  Box,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Link,
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
import React, { useCallback, useMemo } from "react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
  learnMoreLabel: string;
  onLearnMorePress: () => void;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
  learnMoreLabel,
  onLearnMorePress,
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
      <Subheader>
        <Box>
          <SubheaderRow lx={{ flexDirection: "row", justifyContent: "space-between" }}>
            <SubheaderTitle>{strategyLabel}</SubheaderTitle>
            <Link appearance="accent" underline={false} onPress={onLearnMorePress} size="md">
              {learnMoreLabel}
            </Link>
          </SubheaderRow>
        </Box>
      </Subheader>
      <OptionListTrigger onPress={handleOpenSheet}>
        {selectedOption != null && <Text lx={{ color: "base" }}>{selectedOption.label}</Text>}
      </OptionListTrigger>
      <BottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        snapPoints={null}
        onClose={handleCloseSheet}
      >
        <BottomSheetView>
          <BottomSheetHeader title={strategyLabel} />
          <OptionList items={items} value={value || null} onValueChange={handleValueChange}>
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
};

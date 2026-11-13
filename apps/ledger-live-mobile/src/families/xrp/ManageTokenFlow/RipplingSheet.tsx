import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  isRippling: boolean;
  onSelect: (isRippling: boolean) => void;
  onClose: () => void;
}>;

type OptionProps = Readonly<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
  testID: string;
}>;

function RipplingOption(option: OptionProps) {
  return (
    <ListItem onPress={option.onPress} testID={option.testID}>
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{option.label}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      {option.isSelected ? (
        <ListItemTrailing>
          <Check size={20} />
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}

function SheetContent({ isRippling, onSelect }: Omit<Props, "isOpen" | "onClose">) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset }}>
      <BottomSheetHeader />
      <RipplingOption
        label={t("xrp.rippling.deactivated")}
        isSelected={!isRippling}
        onPress={() => onSelect(false)}
        testID="xrp-rippling-option-deactivated"
      />
      <RipplingOption
        label={t("xrp.rippling.activated")}
        isSelected={isRippling}
        onPress={() => onSelect(true)}
        testID="xrp-rippling-option-activated"
      />
    </BottomSheetView>
  );
}

export function RipplingSheet({ isOpen, onClose, ...contentProps }: Props) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="xrp-rippling-sheet"
    >
      <SheetContent {...contentProps} />
    </QueuedBottomSheet>
  );
}

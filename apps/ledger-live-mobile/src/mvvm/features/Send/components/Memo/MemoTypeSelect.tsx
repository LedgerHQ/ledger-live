import {
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
import { useTranslation } from "~/context/Locale";

type MemoTypeSelectProps = Readonly<{
  currencyId: string;
  options: readonly string[];
  value?: string;
  onChange: (value: string) => void;
}>;

function MemoTypeSelectComponent({ currencyId, options, value, onChange }: MemoTypeSelectProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useBottomSheetRef();

  const items = useMemo(
    () =>
      options.map(option => ({
        value: option,
        label: t(`${currencyId}.memoType.${option}`),
      })),
    [currencyId, options, t],
  );

  const selectedItem = useMemo(() => items.find(item => item.value === value), [items, value]);

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

  return (
    <>
      <SelectListTrigger testID="send-memo-type-select" onPress={handleOpenSheet}>
        {selectedItem != null && (
          <Text typography="body1" lx={{ color: "base" }}>
            {selectedItem.label}
          </Text>
        )}
      </SelectListTrigger>
      <BottomSheet ref={bottomSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView>
          <BottomSheetHeader title={t("send.newSendFlow.memo.transactionIdentifier")} />
          <SelectList items={items} value={value ?? null} onValueChange={handleValueChange}>
            <SelectListContent
              lx={{ marginBottom: "s24" }}
              renderItem={item => (
                <SelectListItem testID={`send-memo-type-option-${item.value}`} value={item.value}>
                  <SelectListItemContent>
                    <SelectListItemText>{item.label}</SelectListItemText>
                  </SelectListItemContent>
                </SelectListItem>
              )}
            />
          </SelectList>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

export const MemoTypeSelect = React.memo(MemoTypeSelectComponent);

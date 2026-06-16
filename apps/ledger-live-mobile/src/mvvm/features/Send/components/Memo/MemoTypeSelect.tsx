import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  OptionList,
  OptionListContent,
  OptionListItem,
  OptionListItemContent,
  OptionListItemText,
  OptionListTrigger,
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
      <OptionListTrigger onPress={handleOpenSheet}>
        {selectedItem != null && (
          <Text typography="body1" lx={{ color: "base" }}>
            {selectedItem.label}
          </Text>
        )}
      </OptionListTrigger>
      <BottomSheet ref={bottomSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView>
          <BottomSheetHeader title={t("send.newSendFlow.memo.transactionIdentifier")} />
          <OptionList items={items} value={value ?? null} onValueChange={handleValueChange}>
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
    </>
  );
}

export const MemoTypeSelect = React.memo(MemoTypeSelectComponent);

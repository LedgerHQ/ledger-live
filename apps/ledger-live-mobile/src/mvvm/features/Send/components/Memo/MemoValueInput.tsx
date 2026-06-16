import React, { useCallback } from "react";
import { Pressable } from "react-native";
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Text,
  TextInput,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { sanitizeMemoValue } from "@ledgerhq/live-common/flows/send/recipient/utils/memoValue";
import { useTranslation } from "~/context/Locale";
import { useTranslatedBridgeError } from "../../screens/Recipient/hooks/useTranslatedBridgeError";

type MemoValueInputProps = Readonly<{
  currencyId: string;
  memoLabel: string;
  value: string;
  maxLength?: number;
  memoType?: string;
  memoMaxValue?: number;
  transactionError?: Error;
  onChange: (value: string) => void;
}>;

function MemoValueInputComponent({
  currencyId,
  memoLabel,
  value,
  maxLength,
  memoType,
  memoMaxValue,
  transactionError,
  onChange,
}: MemoValueInputProps) {
  const { t } = useTranslation();
  const helpSheetRef = useBottomSheetRef();
  const translatedError = useTranslatedBridgeError(transactionError);
  const errorMessage = translatedError?.title;

  const isTagType = memoType === "tag";

  const handleChangeText = useCallback(
    (text: string) => {
      onChange(sanitizeMemoValue({ value: text, memoType, memoMaxValue }));
    },
    [memoType, memoMaxValue, onChange],
  );

  const openHelp = useCallback(() => {
    helpSheetRef.current?.present();
  }, [helpSheetRef]);

  return (
    <>
      <TextInput
        testID="send-memo-input"
        label={t("send.newSendFlow.enterTag", { tag: memoLabel })}
        value={value}
        onChangeText={handleChangeText}
        keyboardType={isTagType ? "number-pad" : "default"}
        maxLength={isTagType ? undefined : maxLength}
        helperText={errorMessage}
        status={errorMessage ? "error" : undefined}
        suffix={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("send.newSendFlow.tagHelp.title", { tag: memoLabel })}
            onPress={openHelp}
          >
            <Information size={20} lx={{ color: "muted" }} />
          </Pressable>
        }
      />
      <BottomSheet ref={helpSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView>
          <BottomSheetHeader />
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24", gap: "s12" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base" }}>
              {t("send.newSendFlow.tagHelp.title", { tag: memoLabel })}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {t("send.newSendFlow.tagHelp.description", { tag: memoLabel, currency: currencyId })}
            </Text>
          </Box>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

export const MemoValueInput = React.memo(MemoValueInputComponent);

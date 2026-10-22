import React from "react";
import { KeyboardAvoidingView, type KeyboardAvoidingViewProps } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Box, Button, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../testIds";

type Props = Readonly<{
  name: string;
  maxLength: number;
  isSubmitDisabled: boolean;
  keyboardBehavior: KeyboardAvoidingViewProps["behavior"];
  onChangeName: (name: string) => void;
  onClearName: () => void;
  onSubmit: () => void;
}>;

export function EditNameView({
  name,
  maxLength,
  isSubmitDisabled,
  keyboardBehavior,
  onChangeName,
  onClearName,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView edges={["bottom"]} isFlex testID={ACCOUNT_DETAIL_TEST_IDS.editNameScreen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardBehavior}
        keyboardVerticalOffset={headerHeight}
      >
        <Box lx={contentStyle}>
          <TextInput
            label={t("accountDetail.editName.label")}
            value={name}
            onChangeText={onChangeName}
            onClear={onClearName}
            maxLength={maxLength}
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            testID={ACCOUNT_DETAIL_TEST_IDS.editNameInput}
          />
        </Box>
        <Box lx={footerStyle}>
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={isSubmitDisabled}
            onPress={onSubmit}
            testID={ACCOUNT_DETAIL_TEST_IDS.editNameSubmit}
          >
            {t("accountDetail.editName.submit")}
          </Button>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const contentStyle: LumenViewStyle = {
  flex: 1,
  paddingHorizontal: "s16",
  paddingTop: "s8",
};

const footerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
  paddingBottom: "s16",
};

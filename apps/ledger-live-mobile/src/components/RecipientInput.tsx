import { Flex } from "@ledgerhq/native-ui";
import { PasteMedium } from "@ledgerhq/native-ui/assets/icons";
import React, { ForwardedRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { TextInput as BaseTextInput } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";
import TextInput, { Props as TextInputProps } from "./TextInput";

const PasteButton = styled(TouchableOpacity).attrs(() => ({
  activeOpacity: 0.6,
}))`
  background-color: ${p => p.theme.colors.neutral.c100};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 38px;
  border-width: 0;
`;

const PasteIcon = styled(PasteMedium).attrs(p => ({
  color: p.theme.colors.neutral.c00,
  size: 20,
}))``;

type Props = TextInputProps & {
  ref?: ForwardedRef<BaseTextInput>;
  onPaste?: () => void;
  placeholderTranslationKey: string;
};

const RecipientInput = ({
  ref,
  onPaste,
  placeholderTranslationKey,
  ...props
}: Props) => {
  const { t } = useTranslation();

  return (
    <TextInput
      ref={ref}
      placeholder={t(placeholderTranslationKey)}
      renderRight={
        <Flex alignItems="center" justifyContent="center" pr={2}>
          <PasteButton onPress={onPaste}>
            <PasteIcon />
          </PasteButton>
        </Flex>
      }
      {...props}
    />
  );
};

RecipientInput.defaultProps = {
  placeholderTranslationKey: "transfer.recipient.input",
};

export default memo(RecipientInput);

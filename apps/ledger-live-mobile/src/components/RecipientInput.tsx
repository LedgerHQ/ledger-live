import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/native-ui";
import Paste from "@ledgerhq/icons-ui/native/Paste";
import TextInput, { Props as TextInputProps } from "./TextInput";

type Props = TextInputProps & {
  onPaste?: () => void;
  placeholderTranslationKey?: string;
};

const RecipientInput = ({
  onPaste,
  placeholderTranslationKey = "transfer.recipient.input",
  ...props
}: Props) => {
  const { t } = useTranslation();

  return (
    <TextInput
      testID="recipient-input"
      placeholder={t(placeholderTranslationKey)}
      renderRight={
        <Button onPress={onPaste} Icon={<Paste size="S" />} isNewIcon style={{ width: "auto" }} />
      }
      {...props}
    />
  );
};

export default memo(RecipientInput);

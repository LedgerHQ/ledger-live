import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { AnimatedInput, Button } from "@ledgerhq/native-ui";
import Paste from "@ledgerhq/icons-ui/native/Paste";
import { Props as TextInputProps } from "./TextInput";

type Props = TextInputProps & {
  onPaste?: () => void;
  placeholderTranslationKey: string;
};

const RecipientInput = ({ onPaste, placeholderTranslationKey, ...props }: Props) => {
  const { t } = useTranslation();

  return (
    <AnimatedInput
      testID="recipient-input"
      placeholder={t(placeholderTranslationKey)}
      renderRight={
        <Button onPress={onPaste} Icon={<Paste size="S" />} isNewIcon style={{ width: "auto" }} />
      }
      {...props}
    />
  );
};

RecipientInput.defaultProps = {
  placeholderTranslationKey: "transfer.recipient.input",
};

export default memo(RecipientInput);

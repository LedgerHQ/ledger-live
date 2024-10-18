import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native-animatable";

import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ style, onChange }: MemoTagInputProps<TonTransaction>) {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    setValue(text);
    const isMemoTagSet = !!text;
    const patch = isMemoTagSet ? { comment: { isEncrypted: false, text } } : { comment: undefined };
    onChange({ patch, isMemoTagSet });
  };

  return (
    <View style={style}>
      <AnimatedInput
        testID="memo-tag-input"
        placeholder={t("send.summary.comment")}
        value={value}
        onChangeText={handleChange}
      />
    </View>
  );
}

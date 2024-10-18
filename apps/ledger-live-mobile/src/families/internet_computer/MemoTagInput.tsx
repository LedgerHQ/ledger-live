import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native-animatable";

import { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ style, onChange }: MemoTagInputProps<ICPTransaction>) {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text.replace(/\D/g, "");
    setValue(value);
    const isMemoTagSet = !!value;
    const patch = isMemoTagSet ? { memo: value } : { memo: undefined };
    onChange({ patch, isMemoTagSet });
  };

  return (
    <View style={style}>
      <AnimatedInput
        testID="memo-tag-input"
        placeholder={t("send.summary.memo.title")}
        value={value}
        onChangeText={handleChange}
      />
    </View>
  );
}

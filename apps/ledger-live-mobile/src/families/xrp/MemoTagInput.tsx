import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native-animatable";

import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { MemoTagInputProps } from "LLM/features/MemoTag/types";

export default MemoTagInput;

function MemoTagInput({ style, onChange }: MemoTagInputProps<RippleTransaction>) {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const value = text.replace(/\D/g, "");
    setValue(value);
    const isMemoTagSet = !!value;
    const patch = isMemoTagSet ? { tag: Number(value) } : { tag: undefined };
    onChange({ patch, isMemoTagSet });
  };

  return (
    <View style={style}>
      <AnimatedInput
        testID="memo-tag-input"
        placeholder={t("send.summary.tag")}
        value={value}
        onChangeText={handleChange}
      />
    </View>
  );
}

import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { AnimatedInput } from "@ledgerhq/native-ui";
import { View } from "react-native-animatable";

type Props = {
  onChange: (value: number | undefined) => void;
};

export const MemoTagInput = memo(({ onChange }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");

  const handleChange = (text: string) => {
    const digitStr = text.replace(/\D/g, "");
    const value = digitStr ? parseInt(digitStr, 10) : undefined;
    setValue(value?.toString() ?? "");
    onChange(value);
  };

  return (
    <View style={{ marginTop: 32 }}>
      <AnimatedInput
        testID="memo-tag-input"
        placeholder={t("transfer.memoTag.input")}
        value={value}
        onChangeText={handleChange}
      />
    </View>
  );
});

import React from "react";
import Clipboard from "@react-native-community/clipboard";

import RecipientInput from "../../../../components/RecipientInput";

type Props = {
  value: string;
  onChange: (_: string) => void;
};

function StakeToAccountInput({ onChange, value }: Props) {
  return (
    <RecipientInput
      onPaste={async () => {
        const pastedText = await Clipboard.getString();
        onChange(pastedText);
      }}
      onChangeText={onChange}
      value={value}
    />
  );
}

export default StakeToAccountInput;

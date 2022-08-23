import React, { memo, useCallback } from "react";

import { Checkbox as RNCheckbox } from "@ledgerhq/native-ui";

type Props = {
  isChecked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
};

function CheckBox({ isChecked, disabled, onChange, ...props }: Props) {
  const onPress = useCallback(() => {
    if (!onChange) return;
    onChange(!isChecked);
  }, [isChecked, onChange]);

  return (
    <RNCheckbox
      checked={isChecked}
      onChange={onPress}
      disabled={disabled}
      {...props}
    />
  );
}

export default memo<Props>(CheckBox);

import React, { memo } from "react";
import { GraphTabs } from "@ledgerhq/native-ui";

type Item = {
  key: string;
  label: string;
  value?: any;
};

type Props = {
  value: string;
  items: Item[];
  onChange: (value: Item) => void;
  isDisabled?: boolean;
};

function Pills({ items, value, onChange, isDisabled }: Props) {
  const activeIndex = items.findIndex(item => item.key === value);
  return (
    <GraphTabs
      activeIndex={activeIndex}
      labels={items.map(item => item.label)}
      onChange={activeIndex => onChange(items[activeIndex])}
      disabled={isDisabled}
      size={"small"}
      activeBg={"neutral.c40"}
    />
  );
}

export default memo<Props>(Pills);

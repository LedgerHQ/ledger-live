import React from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import { IconBox } from "../../../Icon";
import Text from "../../../Text";

export type NumberedListItemProps = Omit<BaseListItemProps, "bullet"> & {
  number?: number;
};

export type NumberedListProps = Omit<BaseListProps, "items"> & {
  items: NumberedListItemProps[];
};

export default function NumberedList({
  items,
  ...props
}: NumberedListProps): React.ReactElement {
  return (
    <List
      items={items.map((item, index) => ({
        ...item,
        bullet: (
          <IconBox
            Icon={
              <Text
                variant={"body"}
                fontWeight={"medium"}
                color={"neutral.c100"}
              >
                {item.number ? item.number : index}
              </Text>
            }
            boxSize={36}
          />
        ),
      }))}
      {...props}
    />
  );
}

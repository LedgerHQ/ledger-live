import React, { memo } from "react";
import { ScrollContainer } from "@ledgerhq/native-ui";

import { ActionButtonProps } from "./index";
import Button from "../wrappedUi/Button";

type Props = {
  data: ActionButtonProps[];
};

function FabButtonBar({ data }: Props) {
  return (
    <ScrollContainer
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {data.map(({ children, onPress, Icon, buttonProps, disabled }, index) => (
        <Button
          size={"small"}
          Icon={Icon}
          iconPosition={"left"}
          type={buttonProps?.type ?? "shade"}
          outline={buttonProps?.outline ?? true}
          disabled={disabled}
          onPress={onPress}
          key={index}
          mr={3}
        >
          {children}
        </Button>
      ))}
    </ScrollContainer>
  );
}

export default memo<Props>(FabButtonBar);

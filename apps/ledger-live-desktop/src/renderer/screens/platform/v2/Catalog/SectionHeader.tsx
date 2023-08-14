import React, { PropsWithChildren } from "react";
import { Flex, Text, Icon } from "@ledgerhq/react-ui";

export function SectionHeader({
  children,
  iconLeft,
  renderRight,
}: PropsWithChildren<{ iconLeft: string; renderRight?: () => React.ReactElement<{}> }>) {
  return (
    <Flex marginY={1}>
      <Flex alignItems="center" flex={1}>
        <Flex marginRight={2}>
          <Icon name={iconLeft} />
        </Flex>

        <Text variant="h3">{children}</Text>
      </Flex>

      {renderRight && <Flex>{renderRight()}</Flex>}
    </Flex>
  );
}

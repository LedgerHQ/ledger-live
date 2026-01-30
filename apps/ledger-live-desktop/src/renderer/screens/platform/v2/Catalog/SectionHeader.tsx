import React, { PropsWithChildren } from "react";
import { Flex, Text, Icon } from "@ledgerhq/react-ui";
import type { ReactElement } from "react";

export function SectionHeader({
  children,
  iconLeft,
  renderRight,
}: PropsWithChildren<{ iconLeft: string; renderRight?: () => ReactElement }>) {
  return (
    <Flex marginY={1}>
      <Flex alignItems="center" flex={1}>
        <Flex marginRight={2}>
          <Icon name={iconLeft} />
        </Flex>

        {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Text (react-ui) uses @types/react@18, desktop uses @19 */}
        <Text variant="h3">{children as React.ComponentProps<typeof Text>["children"]}</Text>
      </Flex>

      {renderRight && (
        <Flex>
          {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Flex (react-ui) uses @types/react@18, desktop uses @19; ReactNode types differ */}
          {renderRight() as React.ComponentProps<typeof Flex>["children"]}
        </Flex>
      )}
    </Flex>
  );
}

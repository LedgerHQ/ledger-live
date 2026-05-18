import React, { ComponentType } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
  type IconProps,
} from "@ledgerhq/lumen-ui-rnative";

type Props = Readonly<{
  onPress: () => void;
  title: string;
  Icon: ComponentType<IconProps>;
  testID?: string;
}>;

export function CoinOptionRow({ onPress, title, Icon, testID }: Props) {
  return (
    <ListItem onPress={onPress} testID={testID}>
      <ListItemLeading>
        <Spot appearance="icon" icon={Icon} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

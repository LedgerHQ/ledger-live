import React, { ComponentType, memo } from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  Spot,
  type IconProps,
} from "@ledgerhq/lumen-ui-rnative";

type Props = {
  onPress: () => void;
  title: string;
  Icon: ComponentType<IconProps>;
  subtitle?: string;
  testID?: string;
};

export const OptionButton = memo(({ onPress, title, Icon, subtitle, testID }: Props) => (
  <ListItem onPress={onPress} testID={testID} lx={{ marginHorizontal: "-s8" }}>
    <ListItemLeading>
      <Spot appearance="icon" icon={Icon} />
      <ListItemContent>
        <ListItemTitle>{title}</ListItemTitle>
        {subtitle ? <ListItemDescription>{subtitle}</ListItemDescription> : null}
      </ListItemContent>
    </ListItemLeading>
  </ListItem>
));

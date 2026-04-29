import React, { ComponentType, memo } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  type IconProps,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = {
  onPress: () => void;
  title: string;
  description: string;
  icon: ComponentType<IconProps>;
  trailing?: "externalLink" | "chevron";
  testID?: string;
};

export const HelpListItem = memo(
  ({ onPress, title, description, icon: Icon, trailing = "externalLink", testID }: Props) => (
    <ListItem onPress={onPress} testID={testID} lx={{ marginHorizontal: "-s8" }}>
      <ListItemLeading>
        <Icon size={24} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {trailing === "externalLink" ? (
          <ExternalLink size={24} color="base" />
        ) : (
          <ChevronRight size={24} color="base" />
        )}
      </ListItemTrailing>
    </ListItem>
  ),
);

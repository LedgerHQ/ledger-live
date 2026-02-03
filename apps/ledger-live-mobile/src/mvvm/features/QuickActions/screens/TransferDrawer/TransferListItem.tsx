import React, { memo } from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemSpot,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
} from "@ledgerhq/lumen-ui-rnative";
import { TransferAction } from "../../types";

interface TransferListItemProps {
  readonly action: TransferAction;
}

const TransferListItem = ({ action }: TransferListItemProps) => {
  return (
    <ListItem
      onPress={action.onPress}
      disabled={action.disabled}
      testID={action.testID}
      accessibilityLabel={action.title}
    >
      <ListItemLeading>
        <ListItemSpot appearance="icon" icon={action.icon} />
        <ListItemContent>
          <ListItemTitle>{action.title}</ListItemTitle>
          {action.description && <ListItemDescription>{action.description}</ListItemDescription>}
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
};

export default memo(TransferListItem);

import React from "react";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import Image from "~/renderer/components/Image";
import ExploreImage from "./explore.webp";

type ProfileUpsellViewProps = {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
};

export function ProfileUpsellView({ title, description, cta, onClick }: ProfileUpsellViewProps) {
  return (
    <ListItem
      onClick={onClick}
      className="bg-surface h-auto min-h-64 overflow-visible"
      data-testid="my-wallet-profile-upsell"
    >
      <ListItemLeading>
        <Image resource={ExploreImage} alt="" className="w-48 h-48" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription className="whitespace-normal line-clamp-2">
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Button appearance="base" size="sm">
          {cta}
        </Button>
      </ListItemTrailing>
    </ListItem>
  );
}

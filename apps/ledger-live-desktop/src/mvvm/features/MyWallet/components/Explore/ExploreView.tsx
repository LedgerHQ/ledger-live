import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import Image from "~/renderer/components/Image";
import ExploreImage from "./explore.webp";

export type ExploreViewProps = {
  title: string;
  onClick: () => void;
};

export function ExploreView({ title, onClick }: ExploreViewProps) {
  return (
    <ListItem onClick={onClick} className="bg-muted">
      <ListItemLeading>
        <Image resource={ExploreImage} alt="Explore" className="w-48 h-48" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ExternalLink size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}

import {
  ListItem,
  ListItemLeading,
  Spot,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
  Text,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { IconComponent } from "../../categoryConfig.native";

export interface CatalogRowProps {
  readonly title: string;
  readonly description?: string;
  readonly logo?: IconComponent;
  readonly count?: number;
  readonly onPress?: () => void;
}

export function CatalogRow({ title, description, logo, count, onPress }: CatalogRowProps) {
  return (
    <ListItem onPress={onPress} lx={{ marginHorizontal: "-s8" }}>
      <ListItemLeading lx={{ paddingHorizontal: "s8" }}>
        {logo && <Spot appearance="icon" icon={logo} />}
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          {description && <ListItemDescription>{description}</ListItemDescription>}
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
          {count != null && count > 0 && <Text lx={{ color: "base" }}>{count}</Text>}
          <ChevronRight />
        </Box>
      </ListItemTrailing>
    </ListItem>
  );
}

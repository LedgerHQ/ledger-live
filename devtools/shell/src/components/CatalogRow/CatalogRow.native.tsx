import {
  ListItem,
  ListItemLeading,
  Spot,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
  Text,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ToolKind } from "@devtools/registry";
import type { IconComponent } from "../../categoryConfig";
import { KindTag } from "../KindTag/KindTag";
import { MiniTag } from "../MiniTag/MiniTag";

export interface CatalogRowProps {
  readonly title: string;
  readonly description?: string;
  readonly logo?: IconComponent;
  readonly count?: number;
  readonly kind?: ToolKind;
  readonly owner?: string;
  readonly onPress?: () => void;
}

export function CatalogRow({
  title,
  description,
  logo,
  count,
  kind,
  owner,
  onPress,
}: CatalogRowProps) {
  return (
    <Box lx={{ paddingHorizontal: "s4" }}>
      <ListItem onPress={onPress} accessibilityLabel={title}>
        <ListItemLeading>
          {logo && <Spot icon={logo} />}
          <ListItemContent>
            <Box lx={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "s4" }}>
              <ListItemTitle>{title}</ListItemTitle>
              {kind && <KindTag kind={kind} />}
            </Box>
            {description && <ListItemDescription>{description}</ListItemDescription>}
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
            {owner && <MiniTag label={owner} />}
            {count != null && count > 0 && <Text lx={{ color: "base" }}>{count}</Text>}
            <ChevronRight />
          </Box>
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}

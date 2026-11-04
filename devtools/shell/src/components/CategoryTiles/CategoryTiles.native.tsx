import {
  Box,
  Spot,
  Tile,
  TileContent,
  TileDescription,
  TileTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { CatalogItem } from "../Catalog/Catalog";

const GRID_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "s12",
  paddingHorizontal: "s12",
  paddingVertical: "s8",
} as const;

interface CategoryTilesProps {
  readonly items: CatalogItem[];
}

/** The categories as a two-column grid of tiles, as the desktop overview shows them as cards. */
export function CategoryTiles({ items }: CategoryTilesProps) {
  return (
    <Box lx={GRID_LX}>
      {items.map(({ key, title, logo, count, onPress }) => (
        <Box key={key} style={{ width: "48%" }}>
          <Tile appearance="card" onPress={onPress} accessibilityLabel={title}>
            {logo && <Spot icon={logo} />}
            <TileContent>
              <TileTitle>{title}</TileTitle>
              {count != null && (
                <TileDescription>{count === 1 ? "1 tool" : `${count} tools`}</TileDescription>
              )}
            </TileContent>
          </Tile>
        </Box>
      ))}
    </Box>
  );
}

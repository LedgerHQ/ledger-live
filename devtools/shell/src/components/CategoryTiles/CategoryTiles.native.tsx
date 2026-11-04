import {
  Box,
  Spot,
  Tile,
  TileContent,
  TileDescription,
  TileTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { CatalogItem } from "../Catalog/Catalog";

// Columns are half-width wrappers with their own padding rather than a gap, so two of them always
// fit side by side, even on a 320-point-wide host.
const GRID_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  paddingHorizontal: "s6",
  paddingVertical: "s2",
} as const;

interface CategoryTilesProps {
  readonly items: CatalogItem[];
}

/** The categories as a two-column grid of tiles, as the desktop overview shows them as cards. */
export function CategoryTiles({ items }: CategoryTilesProps) {
  return (
    <Box lx={GRID_LX}>
      {items.map(({ key, title, logo, count, onPress }) => (
        <Box key={key} lx={{ padding: "s6" }} style={{ width: "50%" }}>
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

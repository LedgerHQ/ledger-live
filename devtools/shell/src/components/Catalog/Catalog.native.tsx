import { ScrollView } from "react-native";
import { Divider, Box } from "@ledgerhq/lumen-ui-rnative";
import { CatalogRow } from "../CatalogRow/CatalogRow";
import type { IconComponent } from "../../categoryConfig";

export interface CatalogItem {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly logo?: IconComponent;
  readonly count?: number;
  readonly onPress?: () => void;
}

interface CatalogProps {
  readonly items: CatalogItem[];
}

export function Catalog({ items }: CatalogProps) {
  return (
    <ScrollView>
      {items.map(({ key, ...row }) => (
        <Box key={key}>
          <CatalogRow {...row} />
          <Divider />
        </Box>
      ))}
    </ScrollView>
  );
}

export default Catalog;

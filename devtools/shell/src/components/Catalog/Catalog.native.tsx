import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CatalogRow } from "../CatalogRow/CatalogRow";
import type { ToolKind } from "@devtools/registry";
import type { IconComponent } from "../../categoryConfig";

export interface CatalogItem {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly logo?: IconComponent;
  readonly count?: number;
  readonly kind?: ToolKind;
  readonly owner?: string;
  readonly onPress?: () => void;
}

interface CatalogProps {
  readonly items: CatalogItem[];
}

export function Catalog({ items }: CatalogProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
      {items.map(({ key, ...row }) => (
        <Box key={key}>
          <CatalogRow {...row} />
        </Box>
      ))}
    </ScrollView>
  );
}

import { ScrollView } from "react-native";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { CategoryTiles, WarningBanner } from "../../components";
import { useCategoriesScreenViewModel } from "./useCategoriesScreenViewModel";
import type { CategoriesScreenProps } from "../navigation";

export function CategoriesScreen(props: CategoriesScreenProps) {
  const { items, query, onQueryChange, footer } = useCategoriesScreenViewModel(props);

  return (
    <Box lx={{ flex: 1 }}>
      <WarningBanner />
      <Box lx={{ paddingHorizontal: "s12", paddingVertical: "s8" }}>
        <SearchInput value={query} onChangeText={onQueryChange} placeholder="Search tools" />
      </Box>
      <ScrollView>
        <CategoryTiles items={items} />
      </ScrollView>
      {footer && <Box lx={{ paddingHorizontal: "s12", paddingVertical: "s16" }}>{footer}</Box>}
    </Box>
  );
}

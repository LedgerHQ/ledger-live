import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { WarningBanner } from "../../components/WarningBanner/WarningBanner.native";
import Catalog from "../../components/Catalog/Catalog.native";
import { useCategoriesScreenViewModel } from "./useCategoriesScreenViewModel.native";
import type { CategoriesScreenProps } from "../navigation.native";

export function CategoriesScreen(props: CategoriesScreenProps) {
  const { items, query, onQueryChange } = useCategoriesScreenViewModel(props);

  return (
    <Box lx={{ flex: 1 }}>
      <WarningBanner />
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8" }}>
        <SearchInput value={query} onChangeText={onQueryChange} placeholder="Search tools" />
      </Box>
      <Catalog items={items} />
    </Box>
  );
}

export default CategoriesScreen;

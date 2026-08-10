import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { Catalog, WarningBanner } from "../../components";
import { useCategoriesScreenViewModel } from "./useCategoriesScreenViewModel";
import type { CategoriesScreenProps } from "../navigation";

export function CategoriesScreen(props: CategoriesScreenProps) {
  const { items, query, onQueryChange, footer } = useCategoriesScreenViewModel(props);

  return (
    <Box lx={{ flex: 1 }}>
      <WarningBanner />
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8" }}>
        <SearchInput value={query} onChangeText={onQueryChange} placeholder="Search tools" />
      </Box>
      <Catalog items={items} />
      {footer && <Box lx={{ padding: "s16" }}>{footer}</Box>}
    </Box>
  );
}

export default CategoriesScreen;

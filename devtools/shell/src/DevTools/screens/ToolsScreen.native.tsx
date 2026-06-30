import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import Catalog from "../../components/Catalog/Catalog.native";
import { useToolsScreenViewModel } from "./useToolsScreenViewModel.native";
import type { ToolsScreenProps } from "../navigation.native";

/** Lists the tools of a single category, drilling into the selected tool. */
export function ToolsScreen(props: ToolsScreenProps) {
  const { items, query, onQueryChange } = useToolsScreenViewModel(props);

  return (
    <Box lx={{ flex: 1 }}>
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8" }}>
        <SearchInput value={query} onChangeText={onQueryChange} placeholder="Search tools" />
      </Box>
      <Catalog items={items} />
    </Box>
  );
}

export default ToolsScreen;

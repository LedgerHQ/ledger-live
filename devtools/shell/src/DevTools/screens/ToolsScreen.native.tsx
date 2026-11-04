import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { Catalog } from "../../components";
import { useToolsScreenViewModel } from "./useToolsScreenViewModel";
import type { ToolsScreenProps } from "../navigation";

/** Lists the tools of a single category, drilling into the selected tool. */
export function ToolsScreen(props: ToolsScreenProps) {
  const { items, query, onQueryChange, footer } = useToolsScreenViewModel(props);

  return (
    <Box lx={{ flex: 1 }}>
      <Box lx={{ paddingHorizontal: "s12", paddingVertical: "s8" }}>
        <SearchInput value={query} onChangeText={onQueryChange} placeholder="Search tools" />
      </Box>
      <Catalog items={items} />
      {footer && <Box lx={{ paddingHorizontal: "s12", paddingVertical: "s16" }}>{footer}</Box>}
    </Box>
  );
}

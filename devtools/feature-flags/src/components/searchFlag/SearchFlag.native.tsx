import { SearchInput, Box } from "@ledgerhq/lumen-ui-rnative";
import { FlagMenu } from "../flagMenu/FlagMenu";

export interface SearchFlagProps {
  readonly search: string;
  readonly setSearch: (search: string) => void;
}

export function SearchFlag({ search, setSearch }: SearchFlagProps) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
      <Box lx={{ flex: 1 }}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search flags ..." />
      </Box>
      <FlagMenu />
    </Box>
  );
}

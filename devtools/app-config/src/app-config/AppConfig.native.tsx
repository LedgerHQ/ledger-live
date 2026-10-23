import { ScrollView } from "react-native";
import {
  Box,
  Button,
  createSegmentedControl,
  SearchInput,
  Tag,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import type { ConfigOptionId } from "@shared/app-config";
import type { AppConfigToolProps } from "../types";
import { formatValue } from "./internals/formatValue";
import { pendingLabel } from "./internals/pendingLabel";
import type { AppConfigViewModel, SwitchFilter, SwitchRowState } from "./internals/types";
import { useAppConfigViewModel } from "./internals/useAppConfigViewModel";

const { SegmentedControl: FilterControl, SegmentedControlButton: FilterButton } =
  createSegmentedControl<SwitchFilter>();
const { SegmentedControl: OptionControl, SegmentedControlButton: OptionButton } =
  createSegmentedControl<ConfigOptionId>();

const ROW_LX = { padding: "s16", gap: "s12" } as const;
const HEADER_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;
const TAGS_LX = { flexDirection: "row", gap: "s4" } as const;
const VALUE_LX = { gap: "s2" } as const;
const FOOTER_LX = { padding: "s16", gap: "s12", backgroundColor: "canvas" } as const;
const TOOLBAR_LX = { padding: "s16", gap: "s16" } as const;
const DEFAULT_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;

export function AppConfig(props: AppConfigToolProps) {
  const {
    defaultOptionId,
    rows,
    switchCount,
    pendingCount,
    search,
    setSearch,
    filter,
    setFilter,
    select,
    reload,
  } = useAppConfigViewModel(props);
  const { theme } = useTheme();
  const isPending = pendingCount > 0;

  return (
    <Box lx={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {defaultOptionId ? (
          <Box
            lx={DEFAULT_LX}
            style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
          >
            <Tag size="sm" appearance="gray" label={`Default: ${defaultOptionId}`} />
            <Text typography="body3" lx={{ color: "muted" }} style={{ flexShrink: 1 }}>
              Used by every switch without a saved option.
            </Text>
          </Box>
        ) : null}
        <Box
          lx={TOOLBAR_LX}
          style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
        >
          <SearchInput value={search} onChangeText={setSearch} placeholder="Search switches..." />
          <FilterControl selectedValue={filter} onSelectedChange={setFilter}>
            <FilterButton value="all">All</FilterButton>
            <FilterButton value="switched">Switched</FilterButton>
          </FilterControl>
        </Box>
        {rows.length === 0 && switchCount > 0 ? (
          <Box lx={{ padding: "s16" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              No switch matches.
            </Text>
          </Box>
        ) : null}
        {rows.map(row => (
          <SwitchRow key={row.id} row={row} onSelect={select} />
        ))}
        <Footer pendingCount={pendingCount} onRestart={reload} hidden />
      </ScrollView>
      {isPending ? (
        <Box style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <Footer pendingCount={pendingCount} onRestart={reload} />
        </Box>
      ) : null}
    </Box>
  );
}

function Footer({
  pendingCount,
  onRestart,
  hidden = false,
}: Readonly<{ pendingCount: number; onRestart: () => void; hidden?: boolean }>) {
  const { theme } = useTheme();

  return (
    <Box
      lx={FOOTER_LX}
      style={{
        borderTopWidth: 1,
        borderColor: theme.colors.border.mutedSubtle,
        opacity: hidden ? 0 : 1,
      }}
      pointerEvents={hidden ? "none" : "auto"}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {pendingLabel(Math.max(pendingCount, 1), "restart")}
      </Text>
      <Button appearance="accent" size="sm" onPress={onRestart}>
        Restart
      </Button>
    </Box>
  );
}

function SwitchRow({
  row,
  onSelect,
}: Readonly<{
  row: SwitchRowState;
  onSelect: AppConfigViewModel["select"];
}>) {
  const { theme } = useTheme();

  return (
    <Box lx={ROW_LX} style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}>
      <Box lx={HEADER_LX}>
        <Box lx={{ flex: 1 }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {row.label}
          </Text>
          <Text
            typography="body3"
            lx={{ color: "muted" }}
            style={{ fontFamily: "monospace" }}
            selectable
          >
            {row.id}
          </Text>
        </Box>
      </Box>
      <OptionControl
        selectedValue={row.selectedOptionId}
        onSelectedChange={optionId => onSelect(row.id, optionId)}
      >
        {row.options.map(({ id }) => (
          <OptionButton key={id} value={id}>
            {id}
          </OptionButton>
        ))}
      </OptionControl>
      <Box lx={TAGS_LX}>
        <Tag size="sm" appearance="accent-subtle" label={`Current: ${row.currentOptionId}`} />
        {row.isPending ? (
          <Tag size="sm" appearance="warning" label={`Next: ${row.selectedOptionId}`} />
        ) : null}
      </Box>
      {Object.entries(row.selectedValues ?? {}).map(([name, value]) => (
        <Box key={name} lx={VALUE_LX}>
          <Text typography="body3" lx={{ color: "muted" }} selectable>
            {name}
          </Text>
          <Text
            typography="body3"
            lx={{ color: "base" }}
            style={{ fontFamily: "monospace" }}
            selectable
          >
            {formatValue(value)}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

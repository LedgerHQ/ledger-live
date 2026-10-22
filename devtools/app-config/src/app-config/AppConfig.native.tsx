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
import type { ConfigSelectionId } from "@shared/app-config";
import type { AppConfigToolProps, ConfigValueState } from "../types";
import { formatValue } from "./internals/formatValue";
import { pendingLabel } from "./internals/pendingLabel";
import type {
  AppConfigViewModel,
  FixedRowState,
  RowFilter,
  SwitchRowState,
} from "./internals/types";
import { useAppConfigViewModel } from "./internals/useAppConfigViewModel";

const { SegmentedControl: FilterControl, SegmentedControlButton: FilterButton } =
  createSegmentedControl<RowFilter>();
const { SegmentedControl: OptionControl, SegmentedControlButton: OptionButton } =
  createSegmentedControl<ConfigSelectionId>();

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
  const viewModel = useAppConfigViewModel(props);
  const {
    defaultOptionId,
    switchRows,
    fixedRows,
    rowCount,
    pendingCount,
    search,
    setSearch,
    filter,
    setFilter,
    reload,
  } = viewModel;
  const { theme } = useTheme();
  const isPending = pendingCount > 0;
  const borderBottom = { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle };

  return (
    <Box lx={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {defaultOptionId ? (
          <Box lx={DEFAULT_LX} style={borderBottom}>
            <Tag size="sm" appearance="gray" label={`Default: ${defaultOptionId}`} />
            <Text typography="body3" lx={{ color: "muted" }} style={{ flexShrink: 1 }}>
              Used by every switch without a saved option.
            </Text>
          </Box>
        ) : null}
        <Box lx={TOOLBAR_LX} style={borderBottom}>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Search config..." />
          <FilterControl selectedValue={filter} onSelectedChange={setFilter}>
            <FilterButton value="all">All</FilterButton>
            <FilterButton value="switched">Switched</FilterButton>
          </FilterControl>
        </Box>
        {switchRows.length + fixedRows.length === 0 && rowCount > 0 ? (
          <Box lx={{ padding: "s16" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              Nothing matches.
            </Text>
          </Box>
        ) : null}
        {switchRows.map(row => (
          <SwitchRow key={row.id} row={row} actions={viewModel} />
        ))}
        {fixedRows.length > 0 ? (
          <Box lx={{ padding: "s16" }} style={borderBottom}>
            <Text typography="body2SemiBold" lx={{ color: "muted" }}>
              Fixed values
            </Text>
          </Box>
        ) : null}
        {fixedRows.map(row => (
          <FixedRow key={row.value.name} row={row} />
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

function RowTags({
  row,
}: Readonly<{
  row: Pick<SwitchRowState | FixedRowState, "currentChoice" | "selectedChoice" | "isPending">;
}>) {
  return (
    <Box lx={TAGS_LX}>
      <Tag size="sm" appearance="accent-subtle" label={`Current: ${row.currentChoice}`} />
      {row.isPending ? (
        <Tag size="sm" appearance="warning" label={`Next: ${row.selectedChoice}`} />
      ) : null}
    </Box>
  );
}

function SwitchRow({
  row,
  actions,
}: Readonly<{
  row: SwitchRowState;
  actions: Pick<AppConfigViewModel, "selectOption">;
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
        selectedValue={row.selectedChoice}
        onSelectedChange={selectionId => actions.selectOption(row.id, selectionId)}
      >
        {row.choices.map(choice => (
          <OptionButton key={choice} value={choice}>
            {choice}
          </OptionButton>
        ))}
      </OptionControl>
      <RowTags row={row} />
      {row.values.map(value => (
        <Box key={value.name} lx={VALUE_LX}>
          <Text typography="body3" lx={{ color: "muted" }} selectable>
            {value.name}
          </Text>
          <ValueText value={value} />
        </Box>
      ))}
    </Box>
  );
}

function FixedRow({ row }: Readonly<{ row: FixedRowState }>) {
  const { theme } = useTheme();
  const { value } = row;

  return (
    <Box lx={ROW_LX} style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}>
      <Text
        typography="body3"
        lx={{ color: "muted" }}
        style={{ fontFamily: "monospace" }}
        selectable
      >
        {value.name}
      </Text>
      <ValueText value={value} />
    </Box>
  );
}

function ValueText({ value }: Readonly<{ value: ConfigValueState }>) {
  return (
    <Text typography="body3" lx={{ color: "base" }} style={{ fontFamily: "monospace" }} selectable>
      {formatValue(value.nextValue)}
    </Text>
  );
}

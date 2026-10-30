import { ScrollView } from "react-native";
import {
  Box,
  Button,
  createSegmentedControl,
  IconButton,
  SearchInput,
  Tag,
  Text,
  TextInput,
  useStyleSheet,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import { RefreshBack } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ConfigSelectionId } from "@shared/app-config";
import type { AppConfigToolProps, ConfigValueState } from "../types";
import { formatValue } from "./internals/formatValue";
import { nextLabel } from "./internals/nextLabel";
import { pendingLabel } from "./internals/pendingLabel";
import type {
  AppConfigViewModel,
  FixedChoice,
  FixedRowState,
  RowFilter,
  SwitchRowState,
} from "./internals/types";
import { useAppConfigViewModel } from "./internals/useAppConfigViewModel";
import { isTypeable, useDevValueField } from "./internals/useDevValueField";

const { SegmentedControl: FilterControl, SegmentedControlButton: FilterButton } =
  createSegmentedControl<RowFilter>();
const { SegmentedControl: OptionControl, SegmentedControlButton: OptionButton } =
  createSegmentedControl<ConfigSelectionId>();
const { SegmentedControl: FixedControl, SegmentedControlButton: FixedButton } =
  createSegmentedControl<FixedChoice>();

const ROW_LX = { padding: "s16", gap: "s12" } as const;
const HEADER_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;
const TAGS_LX = { flexDirection: "row", gap: "s4" } as const;
const VALUE_LX = { gap: "s2" } as const;
const FIELD_LX = { flexDirection: "row", alignItems: "flex-start", gap: "s8" } as const;
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
          <FixedRow key={row.value.name} row={row} actions={viewModel} />
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

type DevValueActions = Pick<AppConfigViewModel, "setDevValue" | "removeDevValue" | "registerDraft">;

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
      {row.isPending ? <Tag size="sm" appearance="warning" label={nextLabel(row)} /> : null}
    </Box>
  );
}

function SwitchRow({
  row,
  actions,
}: Readonly<{
  row: SwitchRowState;
  actions: Pick<AppConfigViewModel, "selectOption"> & DevValueActions;
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
          {row.isOnDev && isTypeable(value) ? (
            <DevValueInput value={value} actions={actions} />
          ) : (
            <ReadOnlyValueInput value={value} />
          )}
        </Box>
      ))}
    </Box>
  );
}

function FixedRow({
  row,
  actions,
}: Readonly<{
  row: FixedRowState;
  actions: Pick<AppConfigViewModel, "selectFixed"> & DevValueActions;
}>) {
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
      {row.choices.length > 0 ? (
        <>
          <FixedControl
            selectedValue={row.selectedChoice}
            onSelectedChange={choice => actions.selectFixed(value.name, choice)}
          >
            {row.choices.map(choice => (
              <FixedButton key={choice} value={choice}>
                {choice}
              </FixedButton>
            ))}
          </FixedControl>
          <RowTags row={row} />
        </>
      ) : null}
      {row.isOnDev && isTypeable(value) ? (
        <DevValueInput value={value} actions={actions} />
      ) : (
        <ReadOnlyValueInput value={value} />
      )}
    </Box>
  );
}

function ReadOnlyValueInput({ value }: Readonly<{ value: ConfigValueState }>) {
  const styles = useFieldStyles();

  return (
    <TextInput
      accessibilityLabel={value.name}
      value={formatValue(value.nextValue)}
      readOnly
      containerStyle={styles.container}
      inputStyle={styles.readOnlyInput}
    />
  );
}

function DevValueInput({
  value,
  actions,
}: Readonly<{ value: ConfigValueState; actions: DevValueActions }>) {
  const { draft, setDraft, error, commit } = useDevValueField(value, actions);
  const styles = useFieldStyles();

  return (
    <Box lx={FIELD_LX}>
      <TextInput
        lx={{ flex: 1 }}
        accessibilityLabel={value.name}
        value={draft}
        onChangeText={setDraft}
        onEndEditing={commit}
        status={error === undefined ? undefined : "error"}
        helperText={error}
        containerStyle={styles.container}
        inputStyle={styles.input}
      />
      {value.hasDevValue ? (
        <IconButton
          appearance="gray"
          size="xs"
          icon={RefreshBack}
          accessibilityLabel="Reset"
          onPress={() => actions.removeDevValue(value.name)}
        />
      ) : null}
    </Box>
  );
}

/** A compact field, whether it is editable or not, so that switching a row on or off Dev keeps its layout. */
function useFieldStyles() {
  return useStyleSheet(t => {
    const input = { ...t.typographies.body3, fontFamily: "monospace" };

    return {
      container: {
        minHeight: t.sizes.s32,
        paddingHorizontal: t.spacings.s8,
        borderRadius: t.borderRadius.xs,
      },
      input,
      readOnlyInput: { ...input, color: t.colors.text.muted },
    };
  }, []);
}

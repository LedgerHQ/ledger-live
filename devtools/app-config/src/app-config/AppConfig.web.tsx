import {
  Button,
  createSegmentedControl,
  IconButton,
  SearchInput,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { RefreshBack } from "@ledgerhq/lumen-ui-react/symbols";
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

/** A compact field, whether it is editable or not, so that switching a row on or off Dev keeps its layout. */
const FIELD_CLASS_NAME = "h-32 rounded-xs px-8 [&_input]:body-3 [&_input]:font-mono";

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
  const isPending = pendingCount > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {defaultOptionId ? (
        <div className="flex flex-shrink-0 items-center gap-8 border-b border-muted-subtle px-16 py-12">
          <Tag size="sm" appearance="gray" label={`Default: ${defaultOptionId}`} />
          <span className="body-3 text-muted">Used by every switch without a saved option.</span>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-12 border-b border-muted-subtle px-16 py-12">
          <SearchInput
            className="min-w-0 flex-1"
            placeholder="Search config..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <FilterControl selectedValue={filter} onSelectedChange={setFilter} tabLayout="fit">
            <FilterButton value="all">All</FilterButton>
            <FilterButton value="switched">Switched</FilterButton>
          </FilterControl>
        </div>
        {switchRows.length + fixedRows.length === 0 && rowCount > 0 ? (
          <p className="body-3 text-muted px-16 py-12">Nothing matches.</p>
        ) : null}
        {switchRows.map(row => (
          <SwitchRow key={row.id} row={row} actions={viewModel} />
        ))}
        {fixedRows.length > 0 ? (
          <h3 className="body-2-semi-bold text-muted border-b border-muted-subtle px-16 py-12">
            Fixed values
          </h3>
        ) : null}
        {fixedRows.map(row => (
          <FixedRow key={row.value.name} row={row} actions={viewModel} />
        ))}
        <div
          aria-hidden={!isPending}
          inert={!isPending}
          className={`flex items-center justify-between gap-12 border-t border-muted-subtle bg-canvas px-16 py-12 ${isPending ? "sticky bottom-0 z-10" : "invisible"}`}
        >
          <span className="body-3 text-muted">
            {isPending ? pendingLabel(pendingCount, "reload") : null}
          </span>
          <Button appearance="accent" size="sm" onClick={reload}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}

type DevValueActions = Pick<AppConfigViewModel, "setDevValue" | "removeDevValue" | "registerDraft">;

function RowTags({
  row,
}: Readonly<{
  row: Pick<SwitchRowState | FixedRowState, "currentChoice" | "selectedChoice" | "isPending">;
}>) {
  return (
    <div className="flex gap-4">
      <Tag size="sm" appearance="accent-subtle" label={`Current: ${row.currentChoice}`} />
      {row.isPending ? <Tag size="sm" appearance="warning" label={nextLabel(row)} /> : null}
    </div>
  );
}

function SwitchRow({
  row,
  actions,
}: Readonly<{
  row: SwitchRowState;
  actions: Pick<AppConfigViewModel, "selectOption"> & DevValueActions;
}>) {
  return (
    <section
      aria-label={row.label}
      className="flex flex-col gap-12 border-b border-muted-subtle px-16 py-12"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="min-w-0">
          <div className="body-2-semi-bold text-base">{row.label}</div>
          <div className="body-3 text-muted font-mono select-text">{row.id}</div>
        </div>
        <div className="flex flex-shrink-0 gap-4 flex-col items-end">
          <div className="flex gap-4">
            <OptionControl
              selectedValue={row.selectedChoice}
              tabLayout="fit"
              onSelectedChange={selectionId => actions.selectOption(row.id, selectionId)}
            >
              {row.choices.map(choice => (
                <OptionButton key={choice} value={choice}>
                  {choice}
                </OptionButton>
              ))}
            </OptionControl>
          </div>
          <RowTags row={row} />
        </div>
      </div>
      <dl className="flex flex-col gap-4 select-text">
        {row.values.map(value => (
          <div key={value.name} className="flex items-start gap-8">
            <dt className="body-3 text-muted w-1/3 flex-shrink-0 truncate py-8">{value.name}</dt>
            <dd className="flex min-w-0 flex-1">
              {row.isOnDev && isTypeable(value) ? (
                <DevValueInput value={value} actions={actions} />
              ) : (
                <ReadOnlyValueInput value={value} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FixedRow({
  row,
  actions,
}: Readonly<{
  row: FixedRowState;
  actions: Pick<AppConfigViewModel, "selectFixed"> & DevValueActions;
}>) {
  const { value } = row;

  return (
    <section
      aria-label={value.name}
      className="flex flex-col gap-12 border-b border-muted-subtle px-16 py-12"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="body-3 text-muted font-mono select-text min-w-0 truncate">{value.name}</div>
        {row.choices.length > 0 ? (
          <div className="flex flex-shrink-0 gap-4 flex-col items-end">
            <FixedControl
              selectedValue={row.selectedChoice}
              tabLayout="fit"
              onSelectedChange={choice => actions.selectFixed(value.name, choice)}
            >
              {row.choices.map(choice => (
                <FixedButton key={choice} value={choice}>
                  {choice}
                </FixedButton>
              ))}
            </FixedControl>
            <RowTags row={row} />
          </div>
        ) : null}
      </div>
      {row.isOnDev && isTypeable(value) ? (
        <DevValueInput value={value} actions={actions} />
      ) : (
        <ReadOnlyValueInput value={value} />
      )}
    </section>
  );
}

function ReadOnlyValueInput({ value }: Readonly<{ value: ConfigValueState }>) {
  return (
    <TextInput
      className="min-w-0 flex-1"
      containerClassName={`${FIELD_CLASS_NAME} [&_input]:text-muted`}
      aria-label={value.name}
      value={formatValue(value.nextValue)}
      readOnly
    />
  );
}

function DevValueInput({
  value,
  actions,
}: Readonly<{ value: ConfigValueState; actions: DevValueActions }>) {
  const { draft, setDraft, error, commit } = useDevValueField(value, actions);

  return (
    <div className="flex min-w-0 flex-1 items-start gap-8">
      <TextInput
        className="min-w-0 flex-1"
        containerClassName={FIELD_CLASS_NAME}
        aria-label={value.name}
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === "Enter") commit();
        }}
        status={error === undefined ? undefined : "error"}
        helperText={error}
      />
      {value.hasDevValue ? (
        <IconButton
          appearance="gray"
          size="xs"
          icon={RefreshBack}
          aria-label="Reset"
          onClick={() => actions.removeDevValue(value.name)}
        />
      ) : null}
    </div>
  );
}

import { Button, createSegmentedControl, SearchInput, Tag } from "@ledgerhq/lumen-ui-react";
import type { ConfigSelectionId } from "@shared/app-config";
import type { AppConfigToolProps } from "../types";
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
          <FixedRow key={row.value.name} row={row} />
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

function RowTags({
  row,
}: Readonly<{
  row: Pick<SwitchRowState | FixedRowState, "currentChoice" | "selectedChoice" | "isPending">;
}>) {
  return (
    <div className="flex gap-4">
      <Tag size="sm" appearance="accent-subtle" label={`Current: ${row.currentChoice}`} />
      {row.isPending ? (
        <Tag size="sm" appearance="warning" label={`Next: ${row.selectedChoice}`} />
      ) : null}
    </div>
  );
}

function SwitchRow({
  row,
  actions,
}: Readonly<{
  row: SwitchRowState;
  actions: Pick<AppConfigViewModel, "selectOption">;
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
            <dt className="body-3 text-muted w-1/3 flex-shrink-0 truncate">{value.name}</dt>
            <dd className="body-3 text-base font-mono break-all">{formatValue(value.nextValue)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FixedRow({ row }: Readonly<{ row: FixedRowState }>) {
  const { value } = row;

  return (
    <section
      aria-label={value.name}
      className="flex flex-col gap-12 border-b border-muted-subtle px-16 py-12"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="body-3 text-muted font-mono select-text min-w-0 truncate">{value.name}</div>
      </div>
      <div className="body-3 text-base font-mono break-all select-text">
        {formatValue(value.nextValue)}
      </div>
    </section>
  );
}

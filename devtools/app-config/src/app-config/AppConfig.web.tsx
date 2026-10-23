import { Button, createSegmentedControl, SearchInput, Tag } from "@ledgerhq/lumen-ui-react";
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
            placeholder="Search switches..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <FilterControl selectedValue={filter} onSelectedChange={setFilter} tabLayout="fit">
            <FilterButton value="all">All</FilterButton>
            <FilterButton value="switched">Switched</FilterButton>
          </FilterControl>
        </div>
        {rows.length === 0 && switchCount > 0 ? (
          <p className="body-3 text-muted px-16 py-12">No switch matches.</p>
        ) : null}
        {rows.map(row => (
          <SwitchRow key={row.id} row={row} onSelect={select} />
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

function SwitchRow({
  row,
  onSelect,
}: Readonly<{
  row: SwitchRowState;
  onSelect: AppConfigViewModel["select"];
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
              selectedValue={row.selectedOptionId}
              tabLayout="fit"
              onSelectedChange={optionId => onSelect(row.id, optionId)}
            >
              {row.options.map(({ id }) => (
                <OptionButton key={id} value={id}>
                  {id}
                </OptionButton>
              ))}
            </OptionControl>
          </div>
          <div className="flex gap-4">
            <Tag size="sm" appearance="accent-subtle" label={`Current: ${row.currentOptionId}`} />
            {row.isPending ? (
              <Tag size="sm" appearance="warning" label={`Next: ${row.selectedOptionId}`} />
            ) : null}
          </div>
        </div>
      </div>
      <dl className="flex flex-col gap-4 select-text">
        {Object.entries(row.selectedValues ?? {}).map(([name, value]) => (
          <div key={name} className="flex gap-8">
            <dt className="body-3 text-muted w-1/3 flex-shrink-0 truncate">{name}</dt>
            <dd className="body-3 text-base font-mono break-all">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

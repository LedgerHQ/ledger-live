import { memo } from "react";
import {
  Banner,
  Button,
  Checkbox,
  SearchInput,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableRoot,
} from "@ledgerhq/lumen-ui-react";
import { formatInstant, isStale } from "./logic";
import type { MatrixApp, MatrixColumn, ShownDevice } from "./types";
import type {
  FirmwareAppDeploymentsViewModel,
  VisibleColumn,
} from "./useFirmwareAppDeploymentsViewModel";

const MONO = "font-mono tabular-nums";

/*
 * Lumen's colour tokens are var() indirections, so Tailwind's /opacity modifiers are
 * dropped from them silently — `bg-muted/50` compiles to plain `bg-muted`. These two mix
 * against the canvas explicitly, which keeps them theme-aware and actually lighter.
 *
 * The tint marks the next-OS track. At full strength bg-muted is #f1f1f1, heavy enough to
 * read as a filled slab down the page; the hairline is the rule between rows, which wants
 * to be lighter than the rule under the header.
 */
const TRACK_TINT = "bg-[color-mix(in_srgb,var(--background-muted)_45%,var(--background-canvas))]";
const HAIRLINE =
  "border-[color-mix(in_srgb,var(--border-muted-subtle)_55%,var(--background-canvas))]";

/**
 * Micro-caps for column labels and chips: it separates them from the data at a glance
 * without spending a second colour on the distinction.
 */
const MICRO = "body-4 uppercase tracking-wider";

/*
 * Lumen checks a box with bg-active, the Ledger purple — the only saturated colour on the
 * page, spent on a secondary control. Checked becomes an ink tick in an ink-bordered box,
 * the language the device chips use. Lumen merges className with tailwind-merge, so these
 * replace its own.
 */
const CHECKBOX_INK = [
  "data-[state=checked]:border data-[state=checked]:border-base",
  "data-[state=checked]:bg-base data-[state=checked]:text-base",
  "data-[state=checked]:hover:bg-base-hover",
  "data-[state=checked]:active:bg-base-pressed",
].join(" ");

// A stable identity, so a null matrix does not defeat AppRow's memoisation.
const EMPTY_COLUMNS: Record<string, MatrixColumn[]> = {};

/*
 * The next-OS track is a different axis from the provider, so it is separated by tone
 * rather than by colour — nothing here should read as a status.
 */
const trackClasses = (column: MatrixColumn, startsGroup: boolean) =>
  [column.track === "next" ? TRACK_TINT : "", startsGroup ? "border-l border-muted-subtle" : ""]
    .filter(Boolean)
    .join(" ");

/** The header slot: collection status next to the control that changes it. */
export const FirmwareAppDeploymentsActions = ({
  matrix,
  status,
  refreshing,
  onRefresh,
}: Pick<FirmwareAppDeploymentsViewModel, "matrix" | "status" | "refreshing" | "onRefresh">) => {
  const collectedAt = matrix?.collectedAt;

  return (
    <>
      {status ? (
        <p className="body-4 text-muted">{status}…</p>
      ) : collectedAt ? (
        <p className="body-4 text-muted">
          Updated at{" "}
          {/* Amber past the staleness threshold, so a stale cache shows without a
              separate age readout. */}
          <span className={`${MONO} ${isStale(collectedAt) ? "text-warning" : "text-base"}`}>
            {formatInstant(collectedAt)}
          </span>{" "}
          UTC
        </p>
      ) : null}
      <Button appearance="gray" size="sm" loading={refreshing} onClick={onRefresh}>
        Refresh
      </Button>
    </>
  );
};

/**
 * A visible chip means the app is published on that device. Absent ones keep their layout
 * box but are hidden, so the chip set stays a fixed-width ruler across every row.
 *
 * Plain spans rather than Lumen's Tag, which subscribes to a React context per instance
 * and whose only filled appearance is the purple accent — repeated five times across a
 * few hundred rows, that colour reads as a status the chips do not carry. Shown devices
 * are marked with ink, the rest with a hairline.
 */
const CHIP = `rounded-xs border px-4 ${MICRO} whitespace-nowrap`;

const DeviceChips = ({
  app,
  devices,
  columns,
  selectedKeys,
}: {
  app: MatrixApp;
  devices: ShownDevice[];
  columns: Record<string, MatrixColumn[]>;
  selectedKeys: Set<string>;
}) => (
  <div className="flex flex-nowrap gap-2">
    {devices.map(device => {
      const published = columns[device.key].some(column => app.versions[column.key]);
      const tone = selectedKeys.has(device.key)
        ? "border-base text-base"
        : "border-muted-subtle text-muted";

      return (
        <span key={device.key} className={`${CHIP} ${tone} ${published ? "" : "invisible"}`}>
          {device.label}
        </span>
      );
    })}
  </div>
);

/*
 * The body is plain <tr>/<td> rather than Lumen's TableRow/TableCell, and the cells are
 * built by functions rather than components.
 *
 * A deliberate, measured exception to the design system: toggling a device re-renders the
 * whole catalogue — 235 rows, ~1400 cells — and every Lumen cell runs cva plus
 * tailwind-merge and wraps its children in another flex div. Profiled on a production
 * build, a toggle costs 38ms with them and 30ms without. The header keeps its Lumen
 * components; a dozen cells there cost nothing.
 */
const CELL = "h-48 px-12 py-8 body-3 text-base";

const versionCell = (app: MatrixApp, column: MatrixColumn, startsGroup: boolean) => {
  const entry = app.versions[column.key];
  const classes = `${CELL} ${trackClasses(column, startsGroup)}`;

  if (!entry) {
    return (
      <td key={column.key} className={`${classes} ${MONO} text-muted`}>
        —
      </td>
    );
  }

  return (
    <td key={column.key} className={classes}>
      <div className="flex flex-col">
        <span className={`${MONO} body-3 whitespace-nowrap`}>{entry.version}</span>
        {/*
          Matches the repository link, which is the same text-muted but rendered at 80%
          by the global `a` rule in globals.css. Both are secondary to the version, so
          they should sit at the same weight.
        */}
        <span className={`${MONO} body-4 text-muted whitespace-nowrap opacity-80`}>
          {entry.modified}
        </span>
      </div>
    </td>
  );
};

/**
 * Memoised because a filter keystroke rebuilds the visible list but leaves each surviving
 * row's props untouched, so only the rows entering or leaving the list do any work.
 */
const AppRow = memo(function AppRow({
  app,
  visibleColumns,
  devices,
  columns,
  selectedKeys,
}: {
  app: MatrixApp;
  visibleColumns: VisibleColumn[];
  devices: ShownDevice[];
  columns: Record<string, MatrixColumn[]>;
  selectedKeys: Set<string>;
}) {
  return (
    <tr className={`${HAIRLINE} border-b`}>
      <td className={`${CELL} whitespace-nowrap`}>{app.name}</td>
      <td className={CELL}>
        {app.repo ? (
          <a
            className={`${MONO} body-4 text-muted hover:text-interactive whitespace-nowrap hover:underline`}
            href={`https://github.com/${app.repo}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {app.repo.split("/")[1]}
          </a>
        ) : (
          <span className={`${MONO} text-muted`}>—</span>
        )}
      </td>
      {visibleColumns.map(({ column, startsGroup }) => versionCell(app, column, startsGroup))}
      <td className={`${CELL} w-1`}>
        <DeviceChips app={app} devices={devices} columns={columns} selectedKeys={selectedKeys} />
      </td>
    </tr>
  );
});

export const FirmwareAppDeploymentsView = ({
  matrix,
  deviceOptions,
  devices,
  shownDevices,
  visibleColumns,
  selectedKeys,
  visibleApps,
  visibleCount,
  totalCount,
  filter,
  notice,
  onFilterChange,
  onToggleDevice,
}: FirmwareAppDeploymentsViewModel) => {
  const columns = matrix?.columns ?? EMPTY_COLUMNS;

  return (
    <div className="flex flex-col gap-16">
      {notice ? (
        <Banner
          appearance={notice.appearance}
          title={notice.title}
          description={
            notice.details ? (
              <ul className="body-4 flex list-disc flex-col gap-2 pl-16">
                {notice.details.map(detail => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : undefined
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-12">
        {/*
          Checkboxes, not toggle buttons: a pressed pill reads as a filter chip, promising
          a subset of the rows, which is exactly what this control does not do.
        */}
        <div className="flex flex-wrap items-center gap-16" role="group" aria-label="Devices shown">
          <span className={`${MICRO} text-muted`}>Show</span>
          {deviceOptions.map(device => (
            <div key={device.key} className="flex items-center gap-8">
              <Checkbox
                id={`device-${device.key}`}
                className={CHECKBOX_INK}
                checked={device.selected}
                disabled={device.disabled}
                onCheckedChange={() => onToggleDevice(device.key)}
              />
              <label
                htmlFor={`device-${device.key}`}
                className={`body-3 ${device.disabled ? "text-disabled" : "text-base cursor-pointer"}`}
              >
                {device.label}
              </label>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-8">
          {/*
            SearchInput has no size prop and defaults to a 48px field with 16px text,
            making it the tallest thing in a toolbar of 40px controls and leaving too
            little room for the placeholder. containerClassName and inputClassName are
            the hooks Lumen provides for this.
          */}
          <SearchInput
            value={filter}
            placeholder="Filter by app or repository…"
            aria-label="Filter apps"
            className="w-320"
            containerClassName="h-40"
            inputClassName="body-3"
            onChange={event => onFilterChange(event.target.value)}
          />
          {/*
            The row is space-between, so this sits at the right edge and its width pushes
            the search field. A fixed width and tabular figures keep both still while the
            count reflows on every keystroke.
          */}
          <span className={`${MONO} body-4 text-muted w-80 text-right whitespace-nowrap`}>
            {visibleCount} / {totalCount}
          </span>
        </div>
      </div>

      {/*
        The scroller is its own element rather than TableRoot, which carries Lumen's
        `scrollbar-none`: it does scroll, but with no scrollbar and no hint that anything
        lies beyond the right edge, a matrix this wide just reads as cropped. TableRoot
        stays because it supplies the context the header rows need.
      */}
      <TableRoot>
        <div className="overflow-x-auto">
          {/*
            Lumen's Table is `table-fixed max-w-full`, which sizes columns from the first
            row and caps the table at its container: the matrix would be squeezed until
            every cell truncated, with nothing to scroll. `table-auto` and `max-w-none`
            let it take the width its content needs. Lumen merges className with
            tailwind-merge, so these override rather than pile up.

            border-collapse so the hairline under each row can live on the row itself: a
            table defaults to border-separate, where a border on a <tr> never renders.
          */}
          <Table className="w-full max-w-none min-w-max table-auto border-collapse">
            {/*
              Lumen's own sticky header is switched off on both rows. The scroller above
              sets overflow-x, which makes it a scroll container on both axes, so a sticky
              thead would anchor to a box that never scrolls vertically and never move.
            */}
            <TableHeader className="bg-canvas">
              {/*
                With a single device selected its name is redundant — the selector above
                already shows it — so the label is hidden from sight but kept for
                assistive tech, which keeps the row geometry identical either way.
              */}
              {/*
                The device groups own this row. App, Repository and Devices are peers of
                the provider labels, not of the group above, so they sit on the next row:
                spanning both rows centres them between the two lines, 11px off the
                provider they read alongside.
              */}
              {shownDevices.length > 0 ? (
                <TableHeaderRow stickyHeader={false}>
                  <TableHeaderCell />
                  <TableHeaderCell />
                  {shownDevices.map((device, index) => (
                    <TableHeaderCell
                      key={device.key}
                      scope="colgroup"
                      colSpan={columns[device.key].length}
                      className={`${MICRO} text-base ${index > 0 ? "border-l border-muted-subtle" : ""}`}
                    >
                      <span className={shownDevices.length === 1 ? "sr-only" : ""}>
                        {device.label}
                      </span>
                    </TableHeaderCell>
                  ))}
                  <TableHeaderCell />
                </TableHeaderRow>
              ) : null}

              <TableHeaderRow stickyHeader={false} className="border-muted-subtle border-b">
                <TableHeaderCell className={`${MICRO} text-muted align-top`}>App</TableHeaderCell>
                <TableHeaderCell className={`${MICRO} text-muted align-top`}>
                  Repository
                </TableHeaderCell>
                {shownDevices.flatMap((device, deviceIndex) =>
                  columns[device.key].map((column, columnIndex) => (
                    <TableHeaderCell
                      key={column.key}
                      className={`${MICRO} text-muted align-top ${trackClasses(column, deviceIndex > 0 && columnIndex === 0)}`}
                    >
                      <span className="flex flex-col items-start gap-2">
                        <span className="flex items-center gap-4">
                          {column.provider}
                          {column.track === "next" ? (
                            <span className={`${CHIP} border-muted-subtle text-muted`}>Next</span>
                          ) : null}
                        </span>
                        {/*
                          The provider label above carries no unit, so the version needs
                          one: without it the number reads as the app's, not the OS it
                          was built against.
                        */}
                        <span className={`${MONO} body-4 text-muted normal-case`}>
                          OS {column.firmware}
                        </span>
                      </span>
                    </TableHeaderCell>
                  )),
                )}
                <TableHeaderCell className={`${MICRO} text-muted align-top`}>
                  Devices
                </TableHeaderCell>
              </TableHeaderRow>
            </TableHeader>

            <TableBody>
              {visibleApps.map(app => (
                <AppRow
                  key={app.name}
                  app={app}
                  visibleColumns={visibleColumns}
                  devices={devices}
                  columns={columns}
                  selectedKeys={selectedKeys}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </TableRoot>

      {visibleApps.length === 0 ? (
        <p className="body-3 text-muted py-56 text-center">
          {matrix ? "No app matches this filter." : "Loading catalog…"}
        </p>
      ) : null}
    </div>
  );
};

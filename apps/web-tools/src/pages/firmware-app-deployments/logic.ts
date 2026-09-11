import { DEFAULT_DEVICE, DEVICES, PROVIDERS, STALE_DAYS } from "./constants";
import type {
  CatalogEntry,
  Notice,
  DeviceVersion,
  FinalFirmwareVersion,
  Matrix,
  MatrixApp,
  MatrixColumn,
  ShownDevice,
  Slot,
} from "./types";

/**
 * The message from a thrown value, which is not guaranteed to be an Error. A rejected
 * fetch would otherwise reach the reader as "undefined" — these messages are shown, in a
 * collection warning and in the failure banner.
 */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const isStale = (isoDate: string): boolean =>
  Date.now() - Date.parse(isoDate) > STALE_DAYS * 86_400_000;

/*
 * Timestamps stay ISO-ordered and in UTC rather than localised. This is a machine
 * readout — versions, OS names, hashes — and an ISO date sorts by eye, aligns in a
 * column, and cannot be misread between locales. It also keeps every date on the page in
 * one timezone, so the header and the cells can be compared directly.
 */
export const formatInstant = (isoDate: string): string => isoDate.slice(0, 16).replace("T", " ");

export const isStableFirmware = (name: string): boolean => /^\d+\.\d+\.\d+$/.test(name);

const firmwareCore = (name: string): [number, number, number] | null => {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(name);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};

const compareFirmwareCore = (a: [number, number, number], b: [number, number, number]): number => {
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
};

/**
 * Digit-aware string compare, so -rc10 sorts above -rc2 rather than below it the way a
 * plain lexicographic compare would.
 */
const naturalCompare = new Intl.Collator("en", { numeric: true }).compare;

/**
 * Firmware candidates, best first: stable releases before prereleases, then by number,
 * then by name so -rc10 outranks -rc2. This sets preference order only — which firmware
 * is actually right is settled by fetchSlotCatalog trying them.
 */
export const rankFirmware = (versions: FinalFirmwareVersion[]): FinalFirmwareVersion[] =>
  versions
    .filter(version => firmwareCore(version.name))
    .sort(
      (a, b) =>
        Number(isStableFirmware(b.name)) - Number(isStableFirmware(a.name)) ||
        compareFirmwareCore(firmwareCore(b.name)!, firmwareCore(a.name)!) ||
        naturalCompare(b.name, a.name),
    );

/**
 * The two firmware tracks worth reading for a device and provider:
 *
 *   current — the newest stable OS, i.e. what devices in the field run;
 *   next    — the newest prerelease OS ranked above it, when one is published.
 *
 * The catalog is scoped to a firmware version and an app only appears once it has been
 * rebuilt against that OS, which makes the next track a direct readout of what is ready
 * for the upcoming release.
 */
export const pickFirmwareTracks = (
  candidates: FinalFirmwareVersion[],
): { current: FinalFirmwareVersion | null; next: FinalFirmwareVersion | null } => {
  const current = candidates.find(version => isStableFirmware(version.name));
  if (!current) return { current: null, next: null };

  const next = candidates.find(
    version => compareFirmwareCore(firmwareCore(version.name)!, firmwareCore(current.name)!) > 0,
  );
  return { current, next: next ?? null };
};

/** github.com/LedgerHQ/app-foo -> LedgerHQ/app-foo */
export const repoFromSourceUrl = (sourceUrl: string | undefined): string | null => {
  const match = /github\.com\/([^/]+\/[^/#?]+)/.exec(sourceUrl ?? "");
  return match ? match[1].replace(/\.git$/, "") : null;
};

/** Every device × provider × track combination worth fetching. */
export const planSlots = (
  deviceVersions: DeviceVersion[],
  firmwareVersions: FinalFirmwareVersion[],
  addWarning: (message: string) => void,
): Slot[] => {
  const slots: Slot[] = [];

  for (const device of DEVICES) {
    const apiDevice = deviceVersions.find(candidate => candidate.id === device.id);
    if (!apiDevice) {
      addWarning(`device ${device.label} (id ${device.id}) absent from device_versions`);
      continue;
    }

    for (const provider of PROVIDERS) {
      if (!apiDevice.providers.includes(provider.id)) continue;

      const candidates = rankFirmware(
        firmwareVersions.filter(
          firmware =>
            firmware.device_versions.includes(device.id) &&
            firmware.providers.includes(provider.id),
        ),
      );

      const { current, next } = pickFirmwareTracks(candidates);
      if (!current) {
        addWarning(`${device.key}/${provider.label}: no stable firmware listed — slot skipped`);
        continue;
      }

      const common = { device, provider, targetId: apiDevice.target_id };

      slots.push({
        ...common,
        key: `${device.key}/${provider.label}/current`,
        track: "current",
        // An empty current track means the firmware choice was wrong, so allow fallbacks.
        candidates: candidates.filter(version => isStableFirmware(version.name)),
        mayBeEmpty: false,
      });

      if (next) {
        slots.push({
          ...common,
          key: `${device.key}/${provider.label}/next`,
          track: "next",
          candidates: [next],
          mayBeEmpty: true,
        });
      }
    }
  }

  return slots;
};

/**
 * Whether a parsed cache entry can be rendered. The cache is the only untrusted input the
 * page has, and an empty column array passes a truthiness check while breaking the header:
 * the device survives into the group row with `colSpan={0}` and contributes no cells to
 * the track row below, so the two rows disagree on column count.
 */
export const isUsableMatrix = (value: Matrix | null): boolean => {
  const columns: Record<string, unknown> = value?.columns ?? {};
  const groups = Object.values(columns);

  return Boolean(
    value &&
    value.apps?.length > 0 &&
    groups.length > 0 &&
    groups.every(group => Array.isArray(group) && group.length > 0),
  );
};

/**
 * Warnings belong to the matrix, not to the collection that produced it: a partial result
 * is cached with its warnings, and reopening the page hydrates it without collecting
 * again. Derived here so a missing column never reads as an absent app.
 */
export const incompleteCollectionNotice = (matrix: Matrix | null): Notice | null =>
  matrix && matrix.warnings.length > 0
    ? {
        appearance: "warning",
        title: "Collection was incomplete — some slots are missing.",
        details: matrix.warnings,
      }
    : null;

/**
 * Which devices are shown is view state, and this page is made to be linked, so it lives
 * in the URL.
 *
 * The default selection writes no parameter, so a plain link stays plain. An empty
 * selection is deliberate rather than default, so it needs a spelling of its own —
 * `none`, which no device key can collide with.
 */
export const DEVICES_PARAM = "devices";
const NO_DEVICES = "none";

const isDefaultSelection = (selected: Set<string>) =>
  selected.size === 1 && selected.has(DEFAULT_DEVICE);

export const parseDeviceSelection = (raw: string | null): Set<string> => {
  if (raw === null) return new Set([DEFAULT_DEVICE]);
  if (raw === NO_DEVICES) return new Set();

  const keys = new Set(raw.split(",").filter(Boolean));
  return new Set(DEVICES.filter(device => keys.has(device.key)).map(device => device.key));
};

/** The parameter value for a selection, or `null` when it is the default and can be omitted. */
export const serialiseDeviceSelection = (selected: Set<string>): string | null => {
  if (isDefaultSelection(selected)) return null;
  if (selected.size === 0) return NO_DEVICES;

  // DEVICES order, so the link reads the same however the boxes were clicked.
  return DEVICES.filter(device => selected.has(device.key))
    .map(device => device.key)
    .join(",");
};

/**
 * The devices a matrix can show, in DEVICES order. Derived rather than stored, so the one
 * constant decides both which devices appear and in what order — a cached matrix cannot
 * disagree with the configuration, and reordering DEVICES needs no cache invalidation.
 */
export const devicesInMatrix = (columns: Matrix["columns"] | undefined): ShownDevice[] =>
  DEVICES.filter(device => columns?.[device.key]).map(({ key, label }) => ({ key, label }));

/** Folds fetched catalogs into the shape the table renders from. */
export const buildMatrix = (
  fetched: { slot: Slot; result: { firmware: string; catalog: CatalogEntry[] } }[],
  warnings: string[],
): Matrix => {
  const columnsBySlot: MatrixColumn[] = fetched.map(({ slot, result }) => ({
    key: slot.key,
    deviceKey: slot.device.key,
    provider: slot.provider.label,
    track: slot.track,
    firmware: result.firmware,
  }));

  const providerOrder = new Map(PROVIDERS.map((provider, index) => [provider.label, index]));

  const byDevice = new Map<string, MatrixColumn[]>();
  for (const column of columnsBySlot) {
    const bucket = byDevice.get(column.deviceKey);
    if (bucket) bucket.push(column);
    else byDevice.set(column.deviceKey, [column]);
  }

  const devices = DEVICES.filter(device => byDevice.has(device.key));

  // Providers in configured order, and each provider's current OS before its next.
  const columns = Object.fromEntries(
    devices.map(device => [
      device.key,
      byDevice
        .get(device.key)!
        .sort(
          (a, b) =>
            providerOrder.get(a.provider)! - providerOrder.get(b.provider)! ||
            Number(a.track === "next") - Number(b.track === "next"),
        ),
    ]),
  );

  const byName = new Map<string, MatrixApp>();
  for (const { slot, result } of fetched) {
    for (const entry of result.catalog) {
      let app = byName.get(entry.versionName);
      if (!app) {
        app = {
          name: entry.versionDisplayName || entry.versionName,
          repo: repoFromSourceUrl(entry.sourceURL),
          versions: {},
        };
        byName.set(entry.versionName, app);
      }

      // sourceURL is empty on some slots, so keep the first non-empty one seen.
      app.repo ??= repoFromSourceUrl(entry.sourceURL);

      app.versions[slot.key] = {
        version: entry.version,
        modified: entry.dateModified?.slice(0, 10) ?? "",
      };
    }
  }

  const apps = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

  return { collectedAt: new Date().toISOString(), columns, apps, warnings };
};

export const matchesFilter = (app: MatrixApp, needle: string): boolean =>
  `${app.name} ${app.repo ?? ""}`.toLowerCase().includes(needle);

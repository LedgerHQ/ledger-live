import { fetchCatalog, fetchDeviceVersions, fetchFinalFirmwareVersions } from "./api";
import { FIRMWARE_ATTEMPTS, REQUEST_CONCURRENCY } from "./constants";
import { buildMatrix, errorMessage, planSlots } from "./logic";
import type { CatalogEntry, Matrix, Slot } from "./types";

/** Maps over items with a bounded number of requests in flight, keeping order. */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  transform: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await transform(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

/**
 * Fetches a slot's catalog, trying firmware candidates newest-first until one returns
 * apps. Judging a firmware by its name alone is unreliable — Stax has shipped a
 * production entry named "2.0.2-tr1" whose catalog is empty — so the result decides
 * rather than the name.
 */
const fetchSlotCatalog = async (
  slot: Slot,
  addWarning: (message: string) => void,
): Promise<{ firmware: string; catalog: CatalogEntry[] } | null> => {
  const attempts = slot.mayBeEmpty ? 1 : FIRMWARE_ATTEMPTS;
  const tried: string[] = [];

  for (const firmware of slot.candidates.slice(0, attempts)) {
    tried.push(firmware.name);

    let catalog: CatalogEntry[];
    try {
      catalog = await fetchCatalog({
        provider: slot.provider.id,
        targetId: slot.targetId,
        firmwareVersionName: firmware.name,
      });
    } catch (error) {
      addWarning(`${slot.key}: firmware ${firmware.name} failed — ${errorMessage(error)}`);
      continue;
    }

    if (catalog.length > 0 || slot.mayBeEmpty) {
      return { firmware: firmware.name, catalog };
    }
  }

  addWarning(
    `${slot.key}: no firmware yielded any apps (tried ${tried.join(", ") || "none"}) — skipped`,
  );
  return null;
};

/** Reads the whole matrix from the API. `onProgress` receives a short status line. */
export const collectMatrix = async (onProgress: (status: string) => void): Promise<Matrix> => {
  const warnings: string[] = [];
  const addWarning = (message: string) => warnings.push(message);

  onProgress("reading device and firmware lists");
  const [deviceVersions, firmwareVersions] = await Promise.all([
    fetchDeviceVersions(),
    fetchFinalFirmwareVersions(),
  ]);

  const slots = planSlots(deviceVersions, firmwareVersions, addWarning);

  let completed = 0;
  const fetched = await mapWithConcurrency(slots, REQUEST_CONCURRENCY, async slot => {
    const result = await fetchSlotCatalog(slot, addWarning);
    onProgress(`fetching catalogs ${++completed}/${slots.length}`);
    return { slot, result };
  });

  const matrix = buildMatrix(
    fetched.filter(
      (entry): entry is { slot: Slot; result: { firmware: string; catalog: CatalogEntry[] } } =>
        entry.result !== null,
    ),
    warnings,
  );

  /*
   * If the device and firmware lists arrive but every catalog request fails, the result
   * is a structurally valid matrix describing nothing. Caching that would both hide the
   * outage behind a fresh timestamp and leave the page with no device to select, so treat
   * it as the failure it is and keep any existing cache.
   */
  if (Object.keys(matrix.columns).length === 0) {
    throw new Error(`no catalog could be read for any of the ${slots.length} slots`);
  }

  return matrix;
};

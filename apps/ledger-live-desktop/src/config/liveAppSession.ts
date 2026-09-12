/**
 * A Live App <webview> must never run in the default session: that one belongs
 * to the host renderer and carries its HID device handler (DONJON-1404).
 *
 * Apps pinning a `cacheBustingId` keep a partition of their own (bumping the id
 * resets their storage); the rest share `LIVE_APP_PARTITION`, which is the
 * sharing they already have today by all sitting in the default session.
 */
/** Only the shared partition is prefixed; the pinned ones predate this module. */
const LIVE_APP_PARTITION_PREFIX = "live-app-";

export const LIVE_APP_PARTITION = `persist:${LIVE_APP_PARTITION_PREFIX}shared`;

/**
 * `<idSlug>-<cacheBustingId>`, the naming used before DONJON-1404. Renaming
 * these would orphan every partition already on disk: Settings would stop
 * finding them, so the third-party tokens they hold would survive a Reset.
 */
const PINNED_PARTITION_NAME = /^[a-zA-Z0-9]+-\d+$/;

export type LiveAppSessionManifest = {
  id: string;
  cacheBustingId?: number;
};

export function getLiveAppPartition({ id, cacheBustingId }: LiveAppSessionManifest): string {
  if (cacheBustingId === undefined) return LIVE_APP_PARTITION;
  const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, "");
  return `persist:${sanitizedId}-${cacheBustingId}`;
}

/** `name` is a directory under userData/Partitions, i.e. a partition minus `persist:`. */
export function isLiveAppPartitionName(name: string): boolean {
  return name.startsWith(LIVE_APP_PARTITION_PREFIX) || PINNED_PARTITION_NAME.test(name);
}

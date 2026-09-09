/**
 * A Live App <webview> must never run in the default session: that one belongs
 * to the host renderer and carries its HID device handler (DONJON-1404).
 *
 * Apps pinning a `cacheBustingId` keep a partition of their own (bumping the id
 * resets their storage); the rest share `LIVE_APP_PARTITION`, which is the
 * sharing they already have today by all sitting in the default session.
 */
export const LIVE_APP_PARTITION = "persist:live-apps";

export type LiveAppSessionManifest = {
  id: string;
  cacheBustingId?: number;
};

export function getLiveAppPartition({ id, cacheBustingId }: LiveAppSessionManifest): string {
  if (cacheBustingId === undefined) return LIVE_APP_PARTITION;
  return `persist:${id.replace(/[^a-zA-Z0-9]/g, "")}-${cacheBustingId}`;
}

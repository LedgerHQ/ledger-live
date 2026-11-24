import type { RefObject } from "react";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";

export type ShareSheetContent = Readonly<{
  message: string;
  /** A view to share as a PNG image with the message. */
  capture?: RefObject<unknown>;
}>;

/**
 * Opens the system share sheet. A capture that fails shares the message alone. Resolves once the
 * sheet closes, whether the user shared or cancelled; rejects when the sheet cannot open.
 */
export async function openShareSheet({ message, capture }: ShareSheetContent): Promise<void> {
  const url = capture
    ? await captureRef(capture as Parameters<typeof captureRef>[0], { format: "png" }).catch(
        () => undefined,
      )
    : undefined;
  await Share.open({ url, message, failOnCancel: false });
}

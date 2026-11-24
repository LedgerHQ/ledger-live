import type { RefObject } from "react";
import type { View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";

export type ShareSheetContent = Readonly<{
  message: string;
  /** An image to share with the message, as `captureView` returns it. */
  imageUrl?: string;
}>;

/** Captures a view as a PNG image: its file URL, or `undefined` when the capture fails. */
export async function captureView(view: RefObject<View | null>): Promise<string | undefined> {
  return captureRef(view, { format: "png" }).catch(() => undefined);
}

/**
 * Opens the system share sheet. Resolves once the sheet closes, whether the user shared or
 * cancelled; rejects when the sheet cannot open.
 */
export async function openShareSheet({ message, imageUrl }: ShareSheetContent): Promise<void> {
  await Share.open({ url: imageUrl, message, failOnCancel: false });
}

export type DeviceLanguageContext = Readonly<{
  /** Device name of the language just picked, when a device can show it. */
  pickedLanguage: string | undefined;
  /** Languages the last seen device can install. */
  availableLanguages: readonly string[];
  /** Whether a device was seen, with its current language. */
  lastSeenDevice: Readonly<{ language: string | undefined }> | undefined;
}>;

/**
 * Whether to offer installing the picked language on the last seen device: the device can install
 * it and shows another language today.
 */
export function shouldOfferDeviceLanguage({
  pickedLanguage,
  availableLanguages,
  lastSeenDevice,
}: DeviceLanguageContext): boolean {
  if (pickedLanguage === undefined || lastSeenDevice === undefined) return false;
  return availableLanguages.includes(pickedLanguage) && lastSeenDevice.language !== pickedLanguage;
}

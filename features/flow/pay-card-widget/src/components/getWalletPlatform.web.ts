// Desktop never renders the wallet step, so this value is unreachable; it only exists so shared
// code importing "./getWalletPlatform" resolves on web.
export function getWalletPlatform() {
  return { brand: "Apple" as const, icon: "Apple" as const, i18nKey: "ios" as const };
}

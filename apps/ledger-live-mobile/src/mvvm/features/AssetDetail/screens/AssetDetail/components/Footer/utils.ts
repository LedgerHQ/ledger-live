export function shouldShowMoreButton(isSellAvailable: boolean, isEarnAvailable: boolean): boolean {
  return isSellAvailable || isEarnAvailable;
}

/**
 * Tracks which sheet raised the keyboard that is currently up.
 *
 * A closing sheet retracts the keyboard so its exit animation runs against a stable layout, but
 * `Keyboard.dismiss()` is global. When one sheet hands off to another, the outgoing sheet's exit
 * finishes *after* the incoming one has focused its field, so without an owner the outgoing sheet
 * would close a keyboard it never raised.
 */
let ownerSheetId: string | undefined;

export function claimBottomSheetKeyboard(sheetId: string): void {
  ownerSheetId = sheetId;
}

export function releaseBottomSheetKeyboard(sheetId: string): void {
  if (ownerSheetId !== sheetId) return;

  ownerSheetId = undefined;
}

export function isBottomSheetKeyboardOwnedByAnother(sheetId: string): boolean {
  return ownerSheetId !== undefined && ownerSheetId !== sheetId;
}

export function resetBottomSheetKeyboardOwnership(): void {
  ownerSheetId = undefined;
}

const FREEZE_TITLE = "payTab.card.freezeConfirm.title";
const UNFREEZE_TITLE = "payTab.card.unfreezeConfirm.title";
const FREEZE_CONFIRM = "payTab.card.freezeConfirm.confirm";
const UNFREEZE_CONFIRM = "payTab.card.unfreezeConfirm.confirm";

export function freezeConfirmTitleKey(isFrozen: boolean) {
  return isFrozen ? UNFREEZE_TITLE : FREEZE_TITLE;
}

export function freezeConfirmActionKey(isFrozen: boolean) {
  return isFrozen ? UNFREEZE_CONFIRM : FREEZE_CONFIRM;
}

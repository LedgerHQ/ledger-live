import type { PayCardStatus } from "@domain/api-card-management";

const FREEZE = {
  tile: "payTab.card.freeze",
  title: "payTab.card.freezeConfirm.title",
  action: "payTab.card.freezeConfirm.confirm",
  errorTitle: "payTab.card.freezeConfirm.errorTitle",
} as const;

const UNFREEZE = {
  tile: "payTab.card.unfreeze",
  title: "payTab.card.unfreezeConfirm.title",
  action: "payTab.card.unfreezeConfirm.confirm",
  errorTitle: "payTab.card.unfreezeConfirm.errorTitle",
} as const;

const COPY_BY_STATUS = {
  ACTIVE: FREEZE,
  BLOCKED: FREEZE,
  INACTIVE: FREEZE,
  FROZEN: UNFREEZE,
} as const satisfies Record<PayCardStatus["status"], typeof FREEZE | typeof UNFREEZE>;

export function freezeCopy(status: PayCardStatus["status"] | undefined) {
  return status ? COPY_BY_STATUS[status] : FREEZE;
}

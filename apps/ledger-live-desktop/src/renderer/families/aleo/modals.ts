import type { MakeModalsType } from "~/renderer/modals/types";
import SelfTransferModal from "./SelfTransferModal";
import SendModal from "./SendModal";
import { AleoCustomModal } from "./constants";
import { Data as SendModalData } from "./modals/send/types";

export type ModalsData = {
  [AleoCustomModal.SEND]: SendModalData;
  [AleoCustomModal.SELF_TRANSFER]: SendModalData;
};

const modals: MakeModalsType<ModalsData> = {
  [AleoCustomModal.SEND]: SendModal,
  [AleoCustomModal.SELF_TRANSFER]: SelfTransferModal,
} as const;

export default modals;

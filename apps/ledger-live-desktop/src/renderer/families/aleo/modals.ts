import type { MakeModalsType } from "~/renderer/modals/types";
import type { Data as DefaultSendData } from "~/renderer/modals/Send/Body";
import SelfTransferModal from "./SelfTransferModal";
import { AleoCustomModal } from "./constants";

export type ModalsData = {
  [AleoCustomModal.SELF_TRANSFER]: DefaultSendData;
};

const modals: MakeModalsType<ModalsData> = {
  [AleoCustomModal.SELF_TRANSFER]: SelfTransferModal,
} as const;

export default modals;

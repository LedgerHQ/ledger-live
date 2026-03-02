import type { MakeModalsType } from "~/renderer/modals/types";
import SelfTransferModal from "./SelfTransferModal";

export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
}

export type ModalsData = {
  [AleoCustomModal.SELF_TRANSFER]: unknown;
};

const modals: MakeModalsType<ModalsData> = {
  [AleoCustomModal.SELF_TRANSFER]: SelfTransferModal,
} as const;

export default modals;

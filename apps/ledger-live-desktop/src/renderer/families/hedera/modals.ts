import type { MakeModalsType } from "~/renderer/modals/types";
import MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION from "./ReceiveWithAssociationModal";
import type { Data as ReceiveModalProps } from "./ReceiveWithAssociationModal/types";

export type ModalsData = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: ReceiveModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION,
};

export default modals;

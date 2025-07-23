import type { MakeModalsType } from "~/renderer/modals/types";
import { Data as ReceiveModalProps } from "./ReceiveWithAssociationModal/Body";
import MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION from "./ReceiveWithAssociationModal";

export type ModalsData = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: ReceiveModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION,
};

export default modals;

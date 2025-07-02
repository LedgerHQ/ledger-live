import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_HEDERA_DELEGATE from "./DelegateFlowModal";
import { Data as DelegateProps } from "./DelegateFlowModal/Body";

export type DelegateModalName = null;

export type ModalsData = {
  MODAL_HEDERA_DELEGATE: DelegateProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_HEDERA_DELEGATE,
};

export default modals;

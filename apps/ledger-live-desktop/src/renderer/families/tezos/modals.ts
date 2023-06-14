import MODAL_DELEGATE from "./DelegateFlowModal";
import { Data as DelegateProps } from "./DelegateFlowModal/Body";
import { MakeModalsType } from "../../modals/types";

export type ModalsData = {
  MODAL_DELEGATE: DelegateProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_DELEGATE,
};

export default modals;

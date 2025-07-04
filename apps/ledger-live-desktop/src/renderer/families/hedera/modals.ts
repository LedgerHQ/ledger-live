import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_HEDERA_DELEGATE from "./DelegateFlowModal";
import MODAL_HEDERA_UNDELEGATE from "./UndelegateFlowModal";
import MODAL_HEDERA_REDELEGATE from "./RedelegateFlowModal";
import { Data as DelegateProps } from "./DelegateFlowModal/Body";
import { Data as UndelegateProps } from "./UndelegateFlowModal/Body";
import { Data as RedelegateProps } from "./RedelegateFlowModal/Body";

export type DelegateModalName =
  | "MODAL_HEDERA_DELEGATE"
  | "MODAL_HEDERA_REDELEGATE"
  | "MODAL_HEDERA_UNDELEGATE"
  | "MODAL_HEDERA_CLAIM_REWARDS";

export type ModalsData = {
  MODAL_HEDERA_DELEGATE: DelegateProps;
  MODAL_HEDERA_UNDELEGATE: UndelegateProps;
  MODAL_HEDERA_REDELEGATE: RedelegateProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_HEDERA_DELEGATE,
  MODAL_HEDERA_UNDELEGATE,
  MODAL_HEDERA_REDELEGATE,
};

export default modals;

import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ETH_STAKE from "./StakeFlowModal";
import MODAL_EDIT_TRANSACTION from "./EditTransactionModal";
import { Account } from "@ledgerhq/types-live";
import { StepId } from "./EditTransactionModal/types";

export type ModalsData = {
  MODAL_ETH_STAKE: {
    account: Account;
    checkbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EDIT_TRANSACTION: {
    stepId: StepId;
    onClose: () => void;
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ETH_STAKE,
  MODAL_EDIT_TRANSACTION,
};

export default modals;

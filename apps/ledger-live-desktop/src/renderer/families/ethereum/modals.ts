import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ETH_STAKE from "./StakeFlowModal";
import { Account } from "@ledgerhq/types-live";

export type ModalsData = {
  MODAL_ETH_STAKE: {
    account: Account;
    hasCheckbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ETH_STAKE,
};

export default modals;

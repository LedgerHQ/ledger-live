import React from "react";
import { TokenAccount } from "@ledgerhq/types-live";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import MODAL_DELEGATE from "./DelegateFlowModal";
import { Data as DelegateProps } from "./DelegateFlowModal/Body";
import MODAL_TEZOS_EARNING_CHOICE from "./EarningChoiceModal";
import { Data as EarningChoiceProps } from "./EarningChoiceModal/Body";
import MODAL_TEZOS_UNSTAKE from "./UnstakeFlowModal";
import { Data as UnstakeProps } from "./UnstakeFlowModal/Body";
import { MakeModalsType } from "../../modals/types";

// Pending LIVE-29536: replace this stub with the real Stake flow modal.
type TezosStakeProps = {
  account: TezosAccount | TokenAccount;
  parentAccount?: TezosAccount | null;
  source?: string;
  skipDelegation?: boolean;
};
const MODAL_TEZOS_STAKE: React.ComponentType<TezosStakeProps> = () => null;

export type ModalsData = {
  MODAL_DELEGATE: DelegateProps;
  MODAL_TEZOS_EARNING_CHOICE: EarningChoiceProps;
  MODAL_TEZOS_STAKE: TezosStakeProps;
  MODAL_TEZOS_UNSTAKE: UnstakeProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_DELEGATE,
  MODAL_TEZOS_EARNING_CHOICE,
  MODAL_TEZOS_STAKE,
  MODAL_TEZOS_UNSTAKE,
};

export default modals;

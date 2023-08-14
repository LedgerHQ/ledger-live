import { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getLLDCoinFamily } from "~/renderer/families";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

type Action = {
  key: string;
  onClick?: () => void;
};

export interface ModalStartStakeProps {
  account: AccountLike;
  parentAccount?: Account | undefined | null;
  alwaysShowNoFunds?: boolean;
  source?: string;
}

const ModalStartStake: FC<ModalStartStakeProps> = ({ account, parentAccount, source }) => {
  const currencyFamily = getMainAccount(account, parentAccount).currency.family;
  const manage = getLLDCoinFamily(currencyFamily).accountHeaderManageActions;
  const dispatch = useDispatch();
  let manageList: Action[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount, source });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  useEffect(() => {
    const stakeAction = manageList.find(item => item.key === "Stake");
    dispatch(closeModal("MODAL_START_STAKE"));

    if (stakeAction) {
      stakeAction.onClick?.();
    }
    // ignoring manageList from dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return null;
};

export default ModalStartStake;

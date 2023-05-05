import { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import { Account } from "@ledgerhq/types-live";
import { getLLDCoinFamily } from "~/renderer/families";

type Action = {
  key: string;
  onClick?: () => void;
};

interface ModalStartStakeProps {
  account: Account;
  parentAccount: Account | null;
  alwaysShowNoFunds: boolean;
  source?: string;
}

const ModalStartStake: FC<ModalStartStakeProps> = ({ account, parentAccount, source }) => {
  const currencyFamily = account.currency.family;
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

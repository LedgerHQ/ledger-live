import { useEffect } from "react";
import { Account } from "@ledgerhq/types-live";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import EVMStakingDrawer from "~/renderer/drawers/EVMStakeDrawer";

type Props = {
  account: Account;
  singleProviderRedirectMode?: boolean;
  /** Analytics source */
  source?: string;
  hasCheckbox?: boolean;
};

const StakingModal = (props: Props) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Effectively pretend this is not a modal any more, and just open the side drawer with the same props
    dispatch(closeModal("MODAL_EVM_STAKE"));
    setDrawer(EVMStakingDrawer, props);
  }, [dispatch, props]);

  return null;
};

export default StakingModal;

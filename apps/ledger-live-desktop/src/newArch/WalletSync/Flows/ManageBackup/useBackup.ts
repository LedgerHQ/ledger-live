import { useDispatch, useSelector } from "react-redux";
import { setWalletSync } from "~/renderer/actions/walletSync";
import { walletSyncStateSelector } from "~/renderer/reducers/walletSync";

export function useBackup() {
  const dispatch = useDispatch();
  const hasBackup = useSelector(walletSyncStateSelector);

  const deleteBackup = () => {
    dispatch(setWalletSync(false));
  };

  const createBackup = () => {
    dispatch(setWalletSync(true));
  };

  return {
    hasBackup,
    deleteBackup,
    createBackup,
  };
}

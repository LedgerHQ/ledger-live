import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { logDrawer } from "LLM/components/QueuedDrawer/utils/logDrawer";
import { useDestroyTrustchain } from "../../hooks/useDestroyTrustchain";
import { UseMutationResult } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setWallectSyncManageKeyDrawer } from "~/actions/walletSync";
import { manageKeyDrawerSelector } from "~/reducers/walletSync";
import { track } from "~/analytics";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

const messageLog = "Follow Steps on device";

export type HookResult = {
  isDrawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  handleClose: () => void;
  onClickConfirm: () => Promise<void>;
  deleteMutation: UseMutationResult<void, Error, void, unknown>;
  handleCancel: () => void;
};

export const useManageKeyDrawer = () => {
  const { deleteMutation } = useDestroyTrustchain();

  const isDrawerVisible = useSelector(manageKeyDrawerSelector);

  const dispatch = useDispatch();

  const openDrawer = useCallback(() => {
    dispatch(setWallectSyncManageKeyDrawer(true));

    logDrawer(messageLog, "open");
  }, [dispatch]);

  const closeDrawer = useCallback(() => {
    dispatch(setWallectSyncManageKeyDrawer(false));
    logDrawer(messageLog, "close");
  }, [dispatch]);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const handleClose = () => {
    closeDrawer();

    track("button_clicked", {
      button: AnalyticsButton.Close,
      page: AnalyticsPage.ManageBackup,
    });
  };

  const handleCancel = () => {
    closeDrawer();
    track("button_clicked", {
      button: AnalyticsButton.Keep,
      page: AnalyticsPage.ConfirmDeleteBackup,
    });
  };

  const onClickConfirm = async () => {
    track("button_clicked", {
      button: AnalyticsButton.Delete,
      page: AnalyticsPage.ConfirmDeleteBackup,
    });

    await deleteMutation.mutateAsync();
    closeDrawer();
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  };

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    onClickConfirm,
    deleteMutation,
    handleCancel,
    handleClose,
  };
};

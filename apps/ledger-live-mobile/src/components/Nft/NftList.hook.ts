import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  hideNftCollection,
  updateMainNavigatorVisibility,
} from "../../actions/settings";
import { track } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";

const TOAST_ID = "SUCCESS_HIDE";

export function useNftList() {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const navigation = useNavigation();

  const [onMultiSelectMode, setMultiSelectMode] = useState<boolean>(false);

  const [nftsToHide, setNftsToHide] = useState<ProtoNFT[]>([]);

  // Multi Select ------------------------

  const readOnlyModeAction = useCallback(() => {
    setNftsToHide([]);
    setMultiSelectMode(false);
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch]);

  // Detect change of screen
  useEffect(() => {
    if (!isFocused) {
      readOnlyModeAction();
    }
  }, [readOnlyModeAction, isFocused]);

  const onClickHide = useCallback(() => {
    nftsToHide.forEach(nft => {
      const { accountId } = decodeNftId(nft.id ?? "");
      dispatch(hideNftCollection(`${accountId}|${nft.contract}`));
    });
    pushToast({
      id: TOAST_ID,
      type: "success",
      icon: "success",
      title: t("wallet.nftGallery.filters.alertHide", {
        count: nftsToHide.length,
      }),
    });

    readOnlyModeAction();
  }, [readOnlyModeAction, dispatch, nftsToHide, pushToast, t]);

  const multiSelectModeAction = useCallback(() => {
    setNftsToHide([]);
    setMultiSelectMode(true);
    dispatch(updateMainNavigatorVisibility(false));
  }, [dispatch]);

  const updateListSelect = useCallback(
    (item: ProtoNFT) => {
      if (nftsToHide.includes(item)) {
        setNftsToHide(nftsToHide.filter(e => e.id !== item.id));
      } else {
        setNftsToHide([...nftsToHide, item]);
      }
    },
    [nftsToHide],
  );
  //  ------------------------

  // Navigation ------------------------
  const navigateToNftViewer = useCallback(
    (nft: ProtoNFT, metadata?: NFTMetadata) => {
      track("NFT_clicked", {
        NFT_collection: metadata?.tokenName,
        NFT_title: metadata?.nftName,
      });

      navigation.navigate(NavigatorName.NftNavigator, {
        screen: ScreenName.NftViewer,
        params: {
          nft,
        },
      });
    },
    [navigation],
  );
  // ------------------------

  return {
    navigateToNftViewer,
    updateListSelect,
    multiSelectModeAction,
    readOnlyModeAction,
    onClickHide,
    t,
    nftsToHide,
    onMultiSelectMode,
  };
}

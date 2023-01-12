import { decodeNftId } from "@ledgerhq/live-common/nft/nftId";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  hideNftCollection,
  updateMainNavigatorVisibility,
} from "../../actions/settings";
import { track } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import { isMainNavigatorVisibleSelector } from "../../reducers/settings";

const TOAST_ID = "SUCCESS_HIDE";
export function useNftList() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const navigation = useNavigation();
  const isMainNavigatorVisible = useSelector(isMainNavigatorVisibleSelector);

  const [nftsToHide, setNftsToHide] = useState<ProtoNFT[]>([]);

  // Multi Select ------------------------
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
    setNftsToHide([]);
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch, nftsToHide, pushToast, t]);

  const cancelAction = useCallback(() => {
    setNftsToHide([]);
    dispatch(updateMainNavigatorVisibility(false));
  }, [dispatch]);

  const triggerMultiSelectHideAction = useCallback(() => {
    setNftsToHide([]);
    dispatch(updateMainNavigatorVisibility(true));
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
    triggerMultiSelectHideAction,
    nftsToHide,
    cancelAction,
    onClickHide,
    t,
    isMainNavigatorVisible,
  };
}

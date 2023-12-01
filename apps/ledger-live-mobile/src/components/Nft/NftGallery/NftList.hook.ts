import { decodeNftId } from "@ledgerhq/live-common/nft/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { v4 as uuid } from "uuid";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { BackHandler } from "react-native";
import { hideNftCollection } from "../../../actions/settings";
import { track } from "../../../analytics";
import { NavigatorName, ScreenName } from "~/const";
import { updateMainNavigatorVisibility } from "../../../actions/appstate";
import {
  galleryFilterDrawerVisibleSelector,
  galleryChainFiltersSelector,
} from "../../../reducers/nft";
import { setGalleryChainFilter, setGalleryFilterDrawerVisible } from "../../../actions/nft";
import { NftGalleryChainFiltersState } from "../../../reducers/types";

const TOAST_ID = "SUCCESS_HIDE";

export function useNftList({ nftList }: { nftList?: ProtoNFT[] }) {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const navigation = useNavigation();
  const [multiSelectModeEnabled, setMultiSelectMode] = useState<boolean>(false);
  const isFilterDrawerVisible = useSelector(galleryFilterDrawerVisibleSelector);
  const chainFilters = useSelector(galleryChainFiltersSelector);

  const [nftsToHide, setNftsToHide] = useState<ProtoNFT[]>([]);

  // Multi Select ------------------------

  const exitMultiSelectMode = useCallback(() => {
    setNftsToHide([]);
    setMultiSelectMode(false);
    dispatch(updateMainNavigatorVisibility(true));
  }, [dispatch]);

  // Detect change of screen
  useEffect(() => {
    if (!isFocused) {
      exitMultiSelectMode();
    }

    return () => {
      exitMultiSelectMode();
    };
  }, [exitMultiSelectMode, isFocused, dispatch]);

  const handleBackPress = useCallback(() => {
    if (!multiSelectModeEnabled) return false;
    exitMultiSelectMode();
    return true;
  }, [exitMultiSelectMode, multiSelectModeEnabled]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  const onClickHide = useCallback(() => {
    exitMultiSelectMode();
    nftsToHide.forEach(nft => {
      const { accountId } = decodeNftId(nft.id ?? "");
      dispatch(hideNftCollection(`${accountId}|${nft.contract}`));
    });

    pushToast({
      id: `${TOAST_ID}-${uuid()}`,
      type: "success",
      icon: "success",
      title: t("wallet.nftGallery.filters.alertHide", {
        count: nftsToHide.length,
      }),
    });
  }, [exitMultiSelectMode, dispatch, nftsToHide, pushToast, t]);

  const triggerMultiSelectMode = useCallback(() => {
    setNftsToHide([]);
    setMultiSelectMode(true);
    dispatch(updateMainNavigatorVisibility(false));
  }, [dispatch]);

  const handleSelectableNftPressed = useCallback(
    (item: ProtoNFT) => {
      const collection = nftList?.filter(d => d.contract === item.contract);

      collection?.forEach(nft => {
        if (nftsToHide.includes(nft)) {
          setNftsToHide(nftsToHide.filter(e => e.contract !== nft.contract));
        } else {
          setNftsToHide([...nftsToHide, nft]);
        }
      });
    },
    [nftList, nftsToHide],
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

  // Tracked Events

  const onPressMultiselect = useCallback(() => {
    track("button_clicked", {
      button: "Hide NFTs",
      page: ScreenName.WalletNftGallery,
    });
    triggerMultiSelectMode();
  }, [triggerMultiSelectMode]);

  const onPressHide = useCallback(() => {
    track("button_clicked", {
      button: "Multi Hide NFTs",
      page: ScreenName.WalletNftGallery,
    });
    onClickHide();
  }, [onClickHide]);

  const openFilterDrawer = useCallback(() => {
    dispatch(setGalleryFilterDrawerVisible(true));
  }, [dispatch]);

  const closeFilterDrawer = useCallback(() => {
    dispatch(setGalleryFilterDrawerVisible(false));
  }, [dispatch]);

  const toggleChainFilter = useCallback(
    (filter: keyof NftGalleryChainFiltersState) => {
      dispatch(setGalleryChainFilter([filter, !chainFilters[filter]]));
    },
    [chainFilters, dispatch],
  );

  const onCancelHide = useCallback(() => {
    track("button_clicked", {
      button: "Cancel  Hide NFTs",
      page: ScreenName.WalletNftGallery,
    });
    exitMultiSelectMode();
  }, [exitMultiSelectMode]);

  return {
    navigateToNftViewer,
    handleSelectableNftPressed,
    triggerMultiSelectMode,
    exitMultiSelectMode,
    onClickHide,
    t,
    nftsToHide,
    multiSelectModeEnabled,
    onPressMultiselect,
    onPressHide,
    onCancelHide,
    isFilterDrawerVisible,
    chainFilters,
    toggleChainFilter,
    closeFilterDrawer,
    openFilterDrawer,
  };
}

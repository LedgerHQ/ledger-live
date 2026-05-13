import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { ProductTourDrawerViewModel } from "../types";
import { track } from "~/analytics";
import { NavigatorName } from "~/const/navigation";
import { PAGE_TRACKING_PRODUCT_TOUR } from "../const";
import type { ProductTourPrimaryAction } from "../const";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const deeplinkNonce = useSelector(productTourDeeplinkNonceSelector);
  const lastHandledDeeplinkNonceRef = useRef(0);
  const lwmProductTour = useFeature("lwmProductTour");
  const isLWMProductTourEnabled = !!lwmProductTour?.enabled;
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    !productTourCompleted && isLWMProductTourEnabled,
  );
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const openProductTour = useCallback(() => {
    if (!productTourCompleted && isLWMProductTourEnabled) {
      track("button_clicked", {
        button: "Open",
        page: PAGE_TRACKING_PRODUCT_TOUR,
      });
      setIsDrawerOpen(true);
    }
  }, [productTourCompleted, isLWMProductTourEnabled]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const closeProductTour = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const onPrimaryAction = useCallback(
    (action: ProductTourPrimaryAction) => {
      handleCloseDrawer();

      switch (action) {
        case "done":
          dispatch(setProductTourCompleted(true));
          break;
        case "swap":
          if (shouldDisplayWallet40MainNav) {
            navigation.navigate(NavigatorName.Main, { screen: NavigatorName.Swap });
          } else {
            navigation.navigate(NavigatorName.Swap);
          }
          break;
        case "stake":
          navigation.navigate(NavigatorName.Earn);
          break;
        case "card":
          navigation.navigate(NavigatorName.Card);
          break;
        case "portfolio":
          navigation.navigate(NavigatorName.Main, {
            screen: NavigatorName.Portfolio,
            params: { screen: NavigatorName.WalletTab },
          });
          break;
      }
    },
    [dispatch, handleCloseDrawer, navigation, shouldDisplayWallet40MainNav],
  );

  const onSlideChange = useCallback((index: number) => {
    currentIndexRef.current = index;
    track("product_tour_card", {
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: index + 1,
    });
  }, []);

  useEffect(() => {
    if (isDrawerOpen && (productTourCompleted || !isLWMProductTourEnabled)) {
      setIsDrawerOpen(false);
    }
  }, [isDrawerOpen, productTourCompleted, isLWMProductTourEnabled]);

  useEffect(() => {
    if (deeplinkNonce === 0) {
      return;
    }
    if (deeplinkNonce === lastHandledDeeplinkNonceRef.current) {
      return;
    }
    lastHandledDeeplinkNonceRef.current = deeplinkNonce;
    openProductTour();
  }, [deeplinkNonce, openProductTour]);

  return {
    isDrawerOpen,
    openProductTour,
    closeProductTour,
    onPrimaryAction,
    onSlideChange,
  };
};

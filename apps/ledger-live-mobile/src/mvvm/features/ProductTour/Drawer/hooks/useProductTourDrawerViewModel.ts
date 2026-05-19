import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { ProductTourDrawerViewModel } from "../types";
import { track } from "~/analytics";
import { NavigatorName } from "~/const/navigation";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../const";
import type { ProductTourPrimaryAction } from "../const";

type CloseSource = "cross" | "external" | "internal";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const closeSourceRef = useRef<CloseSource>("external");
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const deeplinkNonce = useSelector(productTourDeeplinkNonceSelector);
  const lastHandledDeeplinkNonceRef = useRef(0);
  const lwmProductTour = useFeature("lwmProductTour");
  const isLWMProductTourEnabled = !!lwmProductTour?.enabled;
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer: openModularDrawer } = useModularDrawerController();

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

  const onCloseButtonPress = useCallback(() => {
    closeSourceRef.current = "cross";
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const closeProductTour = useCallback(() => {
    if (closeSourceRef.current === "external") {
      track("modal_dismissed", {
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: currentIndexRef.current + 1,
      });
    }
    closeSourceRef.current = "external";
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const onPrimaryAction = useCallback(
    (action: ProductTourPrimaryAction) => {
      closeSourceRef.current = "internal";
      handleCloseDrawer();

      switch (action) {
        case "fund":
          openModularDrawer({
            flow: "add_account",
            source: "product_tour",
          });
          break;
        case "swap":
          if (shouldDisplayWallet40MainNav) {
            navigation.navigate(NavigatorName.Main, { screen: NavigatorName.Swap });
          } else {
            navigation.navigate(NavigatorName.Swap);
          }
          break;
        case "stake":
          navigation.navigate(NavigatorName.Main, { screen: NavigatorName.Earn });
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
    [handleCloseDrawer, navigation, openModularDrawer, shouldDisplayWallet40MainNav],
  );

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      track("product_tour_card", {
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: index + 1,
      });
      if (index === PRODUCT_TOUR_LAST_SLIDE_INDEX) {
        dispatch(setProductTourCompleted(true));
      }
    },
    [dispatch],
  );

  const completeProductTour = useCallback(() => {
    closeSourceRef.current = "internal";
    dispatch(setProductTourCompleted(true));
    handleCloseDrawer();
  }, [dispatch, handleCloseDrawer]);

  useEffect(() => {
    if (isDrawerOpen && !isLWMProductTourEnabled) {
      closeSourceRef.current = "internal";
      setIsDrawerOpen(false);
    }
  }, [isDrawerOpen, isLWMProductTourEnabled]);

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
    onCloseButtonPress,
    onPrimaryAction,
    onSlideChange,
    completeProductTour,
  };
};

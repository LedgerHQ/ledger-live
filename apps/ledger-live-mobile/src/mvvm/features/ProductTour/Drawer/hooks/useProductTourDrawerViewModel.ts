import { useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature } from "@features/platform-feature-flags";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
import {
  closeProductTourDrawer,
  openProductTourDrawer,
  selectIsProductTourDrawerOpen,
} from "~/reducers/productTourDrawer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { ProductTourDrawerViewModel } from "../types";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../const";
import type { ProductTourPrimaryAction } from "../const";

type CloseSource = "cross" | "external" | "internal";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const closeSourceRef = useRef<CloseSource>("external");
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const deeplinkNonce = useSelector(productTourDeeplinkNonceSelector);
  const isDrawerOpen = useSelector(selectIsProductTourDrawerOpen);
  const lastHandledDeeplinkNonceRef = useRef(0);
  const lwmProductTour = useFeature("lwmProductTour");
  const isLWMProductTourEnabled = !!lwmProductTour?.enabled;
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { openDrawer: openModularDrawer } = useModularDrawerController();

  const openProductTour = useCallback(() => {
    if (!productTourCompleted && isLWMProductTourEnabled) {
      track("button_clicked", {
        button: "Open",
        page: PAGE_TRACKING_PRODUCT_TOUR,
      });
      dispatch(openProductTourDrawer());
    }
  }, [dispatch, productTourCompleted, isLWMProductTourEnabled]);

  const handleCloseDrawer = useCallback(() => {
    dispatch(closeProductTourDrawer());
  }, [dispatch]);

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
          navigateToSwapTab({ navigation });
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
            params: { screen: ScreenName.Portfolio },
          });
          break;
      }
    },
    [handleCloseDrawer, navigation, openModularDrawer],
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
      dispatch(closeProductTourDrawer());
    }
  }, [dispatch, isDrawerOpen, isLWMProductTourEnabled]);

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

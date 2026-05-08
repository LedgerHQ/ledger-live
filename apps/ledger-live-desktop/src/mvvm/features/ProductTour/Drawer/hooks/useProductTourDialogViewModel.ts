import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { track } from "~/renderer/analytics/segment";
import { setProductTourCompleted } from "~/renderer/actions/settings";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../const";
import { closeProductTour, openProductTour, selectIsProductTourOpen } from "../productTourDialog";
import type { ProductTourPrimaryAction } from "../const";
import type { ProductTourDialogProps } from "../ProductTourDialogView";

export interface ProductTourDialogViewModel extends ProductTourDialogProps {
  readonly productTourCompleted: boolean;
  readonly openDialog: () => void;
}

export const useProductTourDialogViewModel = (): ProductTourDialogViewModel => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const isOpen = useSelector(selectIsProductTourOpen);
  const currentIndexRef = useRef(0);
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "product_tour",
  );

  const handleClose = useCallback(() => {
    dispatch(closeProductTour());
  }, [dispatch]);

  const openDialog = useCallback(() => {
    track("button_clicked", {
      button: "Open",
      page: PAGE_TRACKING_PRODUCT_TOUR,
    });
    dispatch(openProductTour());
  }, [dispatch]);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleClose();
  }, [handleClose]);

  const onDismiss = useCallback(() => {
    track("modal_dismissed", {
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleClose();
  }, [handleClose]);

  const onComplete = useCallback(() => {
    dispatch(setProductTourCompleted(true));
    handleClose();
  }, [dispatch, handleClose]);

  const onPrimaryAction = useCallback(
    (action: ProductTourPrimaryAction) => {
      handleClose();

      switch (action) {
        case "fund":
          openAssetFlow();
          break;
        case "swap":
          navigate("/swap");
          break;
        case "stake":
          navigate("/earn");
          break;
        case "card":
          navigate("/card");
          break;
        case "portfolio":
          navigate("/");
          break;
      }
    },
    [navigate, handleClose, openAssetFlow],
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

  useEffect(() => {
    if (!isOpen) return;
    currentIndexRef.current = 0;
    track("product_tour_card", {
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: 1,
    });
  }, [isOpen]);

  return {
    isOpen,
    onClose,
    onDismiss,
    onComplete,
    productTourCompleted,
    openDialog,
    onPrimaryAction,
    onSlideChange,
  };
};

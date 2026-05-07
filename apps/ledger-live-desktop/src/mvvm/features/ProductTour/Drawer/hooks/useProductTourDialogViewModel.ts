import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { setProductTourCompleted } from "~/renderer/actions/settings";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";
import { PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../const";
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
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "product_tour",
  );

  const openDialog = useCallback(() => {
    dispatch(openProductTour());
  }, [dispatch]);

  const onClose = useCallback(() => {
    dispatch(closeProductTour());
  }, [dispatch]);

  const onComplete = useCallback(() => {
    dispatch(setProductTourCompleted(true));
    onClose();
  }, [dispatch, onClose]);

  const onPrimaryAction = useCallback(
    (action: ProductTourPrimaryAction) => {
      onClose();

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
    [navigate, onClose, openAssetFlow],
  );

  const onSlideChange = useCallback(
    (index: number) => {
      if (index === PRODUCT_TOUR_LAST_SLIDE_INDEX) {
        dispatch(setProductTourCompleted(true));
      }
      // Reserved for analytics in a follow-up ticket
    },
    [dispatch],
  );

  return {
    isOpen,
    onClose,
    onComplete,
    productTourCompleted,
    openDialog,
    onPrimaryAction,
    onSlideChange,
  };
};

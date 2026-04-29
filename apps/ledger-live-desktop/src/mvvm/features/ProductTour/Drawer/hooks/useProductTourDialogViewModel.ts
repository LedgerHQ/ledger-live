import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { setProductTourCompleted } from "~/renderer/actions/settings";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";
import { PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../const";
import type { ProductTourPrimaryAction } from "../const";

export interface ProductTourDialogViewModel {
  readonly productTourCompleted: boolean;
  readonly isDialogOpen: boolean;
  readonly openDialog: () => void;
  readonly closeDialog: () => void;
  readonly completeProductTour: () => void;
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onSlideChange: (index: number) => void;
}

export const useProductTourDialogViewModel = (): ProductTourDialogViewModel => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "product_tour",
  );

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const completeProductTour = useCallback(() => {
    dispatch(setProductTourCompleted(true));
    closeDialog();
  }, [closeDialog, dispatch]);

  const onPrimaryAction = useCallback(
    (action: ProductTourPrimaryAction) => {
      closeDialog();

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
    [closeDialog, navigate, openAssetFlow],
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
    productTourCompleted,
    isDialogOpen,
    openDialog,
    closeDialog,
    completeProductTour,
    onPrimaryAction,
    onSlideChange,
  };
};

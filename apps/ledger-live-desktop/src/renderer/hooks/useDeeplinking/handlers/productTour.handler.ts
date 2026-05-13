import { openProductTour } from "LLD/features/ProductTour/Drawer/productTourDialog";
import { DeeplinkHandler } from "../types";

export const productTourHandler: DeeplinkHandler<"product-tour"> = (
  _route,
  { dispatch, hasCompletedOnboarding, navigate, isProductTourEnabled },
) => {
  if (!hasCompletedOnboarding || !isProductTourEnabled) {
    return;
  }

  navigate("/");
  dispatch(openProductTour());
};

import { useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";

export interface ProductTourDialogViewModel {
  readonly productTourCompleted: boolean;
  readonly isDialogOpen: boolean;
  readonly openDialog: () => void;
  readonly closeDialog: () => void;
  readonly onSlideChange: (index: number) => void;
}

export const useProductTourDialogViewModel = (): ProductTourDialogViewModel => {
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const onSlideChange = (_index: number) => {
    // Reserved for analytics in a follow-up ticket
  };

  return {
    productTourCompleted,
    isDialogOpen,
    openDialog,
    closeDialog,
    onSlideChange,
  };
};

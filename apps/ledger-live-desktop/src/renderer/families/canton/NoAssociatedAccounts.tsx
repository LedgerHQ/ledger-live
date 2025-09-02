import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { openModal, closeModal } from "~/renderer/actions/modals";
import { StepProps } from "~/renderer/modals/AddAccounts/index";

const NoAssociatedAccounts = ({ t, device, currency }: StepProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (currency && device && currency.type === "CryptoCurrency") {
      // Close the current AddAccounts modal first
      dispatch(closeModal("MODAL_ADD_ACCOUNTS"));

      // Then open the Canton onboard modal automatically
      dispatch(
        openModal("MODAL_CANTON_ONBOARD_ACCOUNT", {
          currency,
          device,
          selectedAccounts: [],
          editedNames: {},
        }),
      );
    }
  }, [dispatch, currency, device]);

  return (
    <Box textAlign="center" py={4}>
      {currency && device && currency.type === "CryptoCurrency" && (
        <Button
          primary
          onClick={() => {
            // Close the current AddAccounts modal first
            dispatch(closeModal("MODAL_ADD_ACCOUNTS"));

            // Then open the Canton onboard modal
            dispatch(
              openModal("MODAL_CANTON_ONBOARD_ACCOUNT", {
                currency,
                device,
                selectedAccounts: [],
                editedNames: {},
              }),
            );
          }}
        >
          {t("dashboard.emptyAccountTile.createAccount")}
        </Button>
      )}
    </Box>
  );
};
export default NoAssociatedAccounts;

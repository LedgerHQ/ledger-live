import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
const Receive2NoDevice = ({
  onVerify,
  onContinue,
}: {
  onVerify: Function;
  onContinue?: Function;
}) => {
  return (
    <>
      <Box
        style={{
          width: "100%",
        }}
        pt={4}
        horizontal
        justifyContent="flex-end"
      >
        {onVerify ? (
          <Button outlineGrey onClick={onVerify} data-testid="receive-verify-address-button">
            <Trans i18nKey="common.verifyMyAddress" />
          </Button>
        ) : null}
        {onContinue ? (
          <Button ml={2} primary onClick={onContinue} data-testid="modal-continue-button">
            <Trans i18nKey="common.continue" />
          </Button>
        ) : null}
      </Box>
    </>
  );
};
export default Receive2NoDevice;

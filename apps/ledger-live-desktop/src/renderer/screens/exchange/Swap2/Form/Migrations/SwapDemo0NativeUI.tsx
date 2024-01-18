import React from "react";
import { Box } from "@ledgerhq/react-ui";
import styled from "styled-components";
import ButtonBase from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

const Button = styled(ButtonBase)`
  justify-content: center;
`;

export type SwapDemo0NativeUIProps = {
  disabled: boolean;
  onClick: () => void;
};

export const SwapDemo0NativeUI = (props: SwapDemo0NativeUIProps) => {
  const { disabled, onClick } = props;
  const { t } = useTranslation();
  return (
    <Box>
      <Button primary disabled={disabled} onClick={onClick} data-test-id="exchange-button">
        {t("common.exchange")}
      </Button>
    </Box>
  );
};

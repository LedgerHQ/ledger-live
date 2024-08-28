import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import IconCheck from "~/renderer/icons/Check";
import IconClock from "~/renderer/icons/Clock";
import { colors } from "~/renderer/styles/theme";

const IconWrapper = styled(Box)`
  background: ${colors.lightGreen};
  color: ${colors.positiveGreen};
  width: 50px;
  height: 50px;
  border-radius: 25px;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const WrapperClock = styled(Box).attrs(() => ({
  bg: "palette.background.paper",
  color: "palette.text.shade60",
}))`
  border-radius: 50%;
  position: absolute;
  bottom: -2px;
  right: -2px;
  padding: 2px;
`;

const SellCompleted = () => {
  return (
    <Box alignItems="center">
      <IconWrapper>
        <IconCheck size={20} />
        <WrapperClock>
          <IconClock size={16} />
        </WrapperClock>
      </IconWrapper>
      <Text mt={4} color="palette.text.shade100" ff="Inter|SemiBold" fontSize={5}>
        <Trans i18nKey={`sell.exchangeDrawer.completed.title`} />
      </Text>
      <Text mt={13} textAlign="center" color="palette.text.shade50" ff="Inter|Regular" fontSize={4}>
        <Trans i18nKey={`sell.exchangeDrawer.completed.description`} />
      </Text>
    </Box>
  );
};

export default SellCompleted;

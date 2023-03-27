import React from "react";
import styled from "styled-components";
import Box, { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { useTranslation } from "react-i18next";
import InfoCircle from "~/renderer/icons/InfoCircle";
const CardContent = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
`;
const CardHeaderContainer = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
const CardHeader = styled(Text)`
  font-weight: 600;
  font-size: 12px;
  margin-left: 8px;
`;
const AccountBodyHeader = function() {
  const { t } = useTranslation();
  return (
    <Card px={2} py={2} mb={3} mt={-5}>
      <CardContent>
        <CardHeaderContainer>
          <InfoCircle size={12} />
          <CardHeader>{t("cardano.account.stakingRewardsBanner.cardTitle")}</CardHeader>
        </CardHeaderContainer>
      </CardContent>
    </Card>
  );
};
export default AccountBodyHeader;

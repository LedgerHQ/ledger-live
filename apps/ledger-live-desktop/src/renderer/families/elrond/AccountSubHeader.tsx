import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import Box, { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import ChevronRight from "~/renderer/icons/ChevronRight";
import InfoCircle from "~/renderer/icons/InfoCircle";
import AccountSubHeaderDrawer from "~/renderer/components/AccountSubHeader/AccountSubHeaderDrawer";
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
const CustomButton = styled(Button)`
  border: none;
  padding-right: 14px;
`;
const AccountSubHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  return (
    <Card px={2} py={1} mb={3}>
      <CardContent>
        <CardHeaderContainer>
          <InfoCircle size={12} />

          <CardHeader>{t("elrond.account.subHeader.cardTitle")}</CardHeader>
        </CardHeaderContainer>

        <CustomButton outline={true} onClick={openDrawer}>
          <Box horizontal={true} flow={1} alignItems="center">
            <Box fontSize={3}>
              <Trans i18nKey="elrond.account.subHeader.moreInfo" />
            </Box>

            <ChevronRight size={12} />
          </Box>
        </CustomButton>
      </CardContent>

      <AccountSubHeaderDrawer
        isOpen={isDrawerOpen}
        closeDrawer={closeDrawer}
        team="MultiversX"
        family="MultiversX"
      />
    </Card>
  );
};
export default AccountSubHeader;

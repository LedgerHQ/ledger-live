import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import Box, { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import ChevronRight from "~/renderer/icons/ChevronRight";
import InfoCircle from "~/renderer/icons/InfoCircle";
import AccountSubHeaderDrawer from "./AccountSubHeaderDrawer";
const AccountSubHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { t } = useTranslation();
  return (
    <Card px={2} py={1} mb={3}>
      <CardContent>
        <CardHeaderContainer>
          <InfoCircle size={12} />
          <CardHeader>{t("near.account.subHeader.cardTitle")}</CardHeader>
        </CardHeaderContainer>
        <CustomButton outline onClick={() => setIsDrawerOpen(true)}>
          <Box horizontal flow={1} alignItems="center">
            <Box fontSize={3}>
              <Trans i18nKey="near.account.subHeader.moreInfo" />
            </Box>
            <ChevronRight size={12} />
          </Box>
        </CustomButton>
      </CardContent>
      <AccountSubHeaderDrawer isOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)} />
    </Card>
  );
};
export const CardContent: ThemedComponent<{}> = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
`;
export const CardHeaderContainer: ThemedComponent<{}> = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
export const CardHeader: ThemedComponent<{}> = styled(Text)`
  font-weight: 600;
  font-size: 12px;
  margin-left: 8px;
`;
export const CustomButton: ThemedComponent<{}> = styled(Button)`
  border: none;
  padding-right: 14px;
`;
export default AccountSubHeader;

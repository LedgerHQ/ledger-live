import React, { Fragment, useState } from "react";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { Trans, useTranslation } from "react-i18next";
import { SubAccount } from "@ledgerhq/types-live";
import styled from "styled-components";

import Box, { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import ChevronRight from "~/renderer/icons/ChevronRight";
import InfoCircle from "~/renderer/icons/InfoCircle";
import AccountSubHeaderDrawer from "~/renderer/components/AccountSubHeader/AccountSubHeaderDrawer";
import Alert from "~/renderer/components/Alert";

export interface AccountSubHeaderPropsType {
  account: ElrondAccount | SubAccount;
}

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
const AccountSubHeader = ({ account }: AccountSubHeaderPropsType) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const isGuarded =
    account.type === "Account" && account.elrondResources
      ? account.elrondResources.isGuarded
      : false;

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Fragment>
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

      {isGuarded && (
        <Alert type="warning" mb={3}>
          <Trans i18nKey={`elrond.guardedAccountWarning`} />
        </Alert>
      )}
    </Fragment>
  );
};
export default AccountSubHeader;

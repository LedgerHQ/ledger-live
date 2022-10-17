// @flow

import React from "react";
import Box, { Card } from "~/renderer/components/Box";
import { Trans, useTranslation } from "react-i18next";
import ChevronRight from "~/renderer/icons/ChevronRight";
import InfoCircle from "~/renderer/icons/InfoCircle";
import AccountSubHeaderDrawer from "./AccountSubHeaderDrawer";
import * as S from "./AccountSubHeader.styles";

const AccountSubHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <Card px={2} py={1} mb={3}>
      <S.CardContent>
        <S.CardHeaderContainer>
          <InfoCircle size={12} />
          <S.CardHeader>{t("celo.account.subHeader.cardTitle")}</S.CardHeader>
        </S.CardHeaderContainer>
        <S.CustomButton outline onClick={() => setIsDrawerOpen(true)}>
          <Box horizontal flow={1} alignItems="center">
            <Box fontSize={3}>
              <Trans i18nKey="celo.account.subHeader.moreInfo" />
            </Box>
            <ChevronRight size={12} />
          </Box>
        </S.CustomButton>
      </S.CardContent>
      <AccountSubHeaderDrawer isOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)} />
    </Card>
  );
};

export default AccountSubHeader;

import React, { useMemo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import {
  AccountItem,
  Account as AccountItemAccount,
} from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls/index";
import { Account } from "@ledgerhq/types-live";
import { formatAddress } from "~/newArch/utils/formatAddress";
import { useSelector } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import styled, { useTheme } from "styled-components";
import { Title } from "../../components/Header/Title";
import { Box, Button, Flex, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

interface Props {
  accounts: Account[];
}

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;
export const AccountsAdded = ({ accounts }: Readonly<Props>) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const walletState = useSelector(walletSelector);

  const formattedAccounts = useMemo(
    () =>
      accounts.map(
        (account): AccountItemAccount => ({
          address: formatAddress(account.freshAddress),
          cryptoId: account.currency.id,
          fiatValue: account.balance.toString(),
          id: account.id,
          name: accountNameWithDefaultSelector(walletState, account),
          ticker: account.currency.ticker,
        }),
      ),
    [accounts, walletState],
  );

  const renderAccount = (x: AccountItemAccount) => (
    <AccountItem
      account={x}
      // onClick={() => {}}
      rightElement={{
        type: "arrow",
      }}
    />
  );

  return (
    <Flex flexDirection="column" justifyContent="space-between" height="100%">
      <Flex flex={1} flexDirection="column" width="100%" alignItems="center">
        <TrackPage category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY} name="AccountsAdded" />
        <Container>
          <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
        </Container>
        <Title translationKey={"modularAssetDrawer.accountsAdded.title"} count={accounts.length} />
        <Flex flex={1} flexDirection="column" width="100%" mt="5">
          <VirtualList
            gap={16}
            items={formattedAccounts}
            itemHeight={72}
            renderItem={renderAccount}
            hasNextPage={false}
            onVisibleItemsScrollEnd={() => {}}
          />
        </Flex>
      </Flex>
      <Flex flexDirection="column" width="100%" mt="5">
        <Button onClick={() => {}} size="large" variant="main" mb="3">
          {t("modularAssetDrawer.accountsAdded.cta.addFunds")}
        </Button>
        <Button onClick={() => {}} size="large" variant="main" outline>
          {t("modularAssetDrawer.accountsAdded.cta.close")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default AccountsAdded;

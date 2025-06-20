import React, { useCallback } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { formatAddress } from "~/newArch/utils/formatAddress";
import { useSelector } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import styled, { useTheme } from "styled-components";
import { Title } from "../../components/Header/Title";
import { Box, Button, Flex, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { getBalanceAndFiatValue } from "~/newArch/utils/getBalanceAndFiatValue";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";

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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();
  const discreet = useSelector(discreetModeSelector);

  const formatAccount = useCallback(
    (account: Account): AccountItem => {
      const { fiatValue } = getBalanceAndFiatValue(account, state, counterValueCurrency, discreet);
      const currency = account.currency;
      const protocol =
        account.type === "Account" &&
        account?.derivationMode !== undefined &&
        account?.derivationMode !== null &&
        currency.type === "CryptoCurrency" &&
        getTagDerivationMode(currency, account.derivationMode);

      return {
        address: formatAddress(account.freshAddress),
        cryptoId: account.currency.id,
        fiatValue,
        protocol: protocol || "",
        id: account.id,
        name: accountNameWithDefaultSelector(walletState, account),
        ticker: account.currency.ticker,
      };
    },
    [counterValueCurrency, discreet, state, walletState],
  );

  const renderAccount = (account: Account) => {
    const accountFormatted = formatAccount(account);
    return (
      <Box mb={16} key={account.id}>
        <AccountItem
          account={accountFormatted}
          rightElement={{
            type: "arrow",
          }}
          onClick={() => {}} // TODO : Implement navigation to account details
          backgroundColor={colors.opacityDefault.c05}
        />
      </Box>
    );
  };

  return (
    <Flex flexDirection="column" justifyContent="space-between" height="100%">
      <Flex flex={1} flexDirection="column" width="100%" alignItems="center">
        {/* TODO : Add green gradient */}
        <TrackPage category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY} name="AccountsAdded" />
        <Container>
          <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
        </Container>
        <Title translationKey={"modularAssetDrawer.accountsAdded.title"} count={accounts.length} />
        <Flex flex={1} flexDirection="column" width="100%" mt={5}>
          {accounts.map(renderAccount)}
        </Flex>
      </Flex>
      <Flex flexDirection="column" width="100%" mt="5">
        {/* TODO : Implement redirection to next step */}
        <Button onClick={() => {}} size="large" variant="main" mb="3">
          {t("modularAssetDrawer.accountsAdded.cta.addFunds")}
        </Button>
        {/* TODO : Implement close */}
        <Button onClick={() => {}} size="large" variant="main" outline>
          {t("modularAssetDrawer.accountsAdded.cta.close")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default AccountsAdded;

import React, { useMemo, useCallback } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation, Trans, TFunction } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import IconReceive from "~/renderer/icons/Receive";
import IconExchange from "~/renderer/icons/Exchange";
import Box from "~/renderer/components/Box";
import Image from "~/renderer/components/Image";
import lightEmptyStateAccount from "~/renderer/images/light-empty-state-account.svg";
import darkEmptyStateAccount from "~/renderer/images/dark-empty-state-account.svg";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import styled from "styled-components";
import { withRouter } from "react-router-dom";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
const mapDispatchToProps = {
  openModal,
};
type OwnProps = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
type Props = OwnProps & {
  t: TFunction;
  history: any;
  openModal: Function;
};
function EmptyStateAccount({ t, account, parentAccount, openModal, history }: Props) {
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);
  const rampCatalog = useRampCatalog();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");

  // eslint-disable-next-line no-unused-vars
  const [availableOnBuy, availableOnSell] = useMemo(() => {
    if (!rampCatalog.value) {
      return [false, false];
    }
    const allBuyableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(rampCatalog.value.onRamp);
    const allSellableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(
      rampCatalog.value.offRamp,
    );
    return [
      allBuyableCryptoCurrencyIds.includes(currency.id),
      allSellableCryptoCurrencyIds.includes(currency.id),
    ];
  }, [rampCatalog.value, currency.id]);
  const hasTokens =
    mainAccount.subAccounts &&
    mainAccount.subAccounts.length &&
    mainAccount.subAccounts[0].type === "TokenAccount";
  const onBuy = useCallback(() => {
    setTrackingSource("empty state account");
    history.push({
      pathname: "/exchange",
      state: ptxSmartRouting?.enabled
        ? {
            currency: currency?.id,
            account: mainAccount?.id,
            mode: "buy", // buy or sell
          }
        : {
            mode: "onRamp",
            currencyId: currency.id,
            accountId: mainAccount.id,
          },
    });
  }, [currency, history, mainAccount, ptxSmartRouting]);
  if (!mainAccount) return null;
  return (
    <Box mt={10} alignItems="center" selectable>
      <Image
        alt="emptyState Account logo"
        resource={{
          light: lightEmptyStateAccount,
          dark: darkEmptyStateAccount,
        }}
        width="400"
        themeTyped
      />
      <Box mt={5} alignItems="center">
        <Title>{t("account.emptyState.title")}</Title>
        <Description
          mt={3}
          style={{
            display: "block",
          }}
        >
          {hasTokens ? (
            <Trans i18nKey="account.emptyState.descToken">
              {"Make sure the"}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {mainAccount.currency.managerAppName}
              </Text>
              {"app is installed and start receiving"}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {mainAccount.currency.ticker}
              </Text>
              {"and"}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {account &&
                  account.currency &&
                  listTokenTypesForCryptoCurrency(account.currency).join(", ")}
                {"tokens"}
              </Text>
            </Trans>
          ) : (
            <Trans i18nKey="account.emptyState.desc">
              {"Make sure the"}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {mainAccount.currency.managerAppName}
              </Text>
              {"app is installed and start receiving"}
            </Trans>
          )}
        </Description>
        <Box horizontal>
          {availableOnBuy ? (
            <Button mt={5} mr={2} primary onClick={onBuy}>
              <Box horizontal flow={1} alignItems="center">
                <IconExchange size={12} />
                <Box>{t("account.emptyState.buttons.buy")}</Box>
              </Box>
            </Button>
          ) : null}
          <Button
            mt={5}
            primary
            onClick={() =>
              openModal("MODAL_RECEIVE", {
                account,
                parentAccount,
              })
            }
          >
            <Box horizontal flow={1} alignItems="center">
              <IconReceive size={12} />
              <Box>{t("account.emptyState.buttons.receiveFunds")}</Box>
            </Box>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
const Title: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 6,
  color: "palette.text.shade100",
}))``;
const Description: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 4,
  color: "palette.text.shade80",
  textAlign: "center",
}))``;
const ConnectedEmptyStateAccount: React$ComponentType<OwnProps> = compose(
  connect(null, mapDispatchToProps),
  withRouter,
  withTranslation(),
)(EmptyStateAccount);
export default ConnectedEmptyStateAccount;

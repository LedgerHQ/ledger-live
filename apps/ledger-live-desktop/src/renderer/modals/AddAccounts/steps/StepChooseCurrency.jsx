// @flow

import React, { useMemo, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  listSupportedCurrencies,
  listTokens,
  isCurrencySupported,
} from "@ledgerhq/live-common/currencies/index";
import { findTokenAccountByCurrency } from "@ledgerhq/live-common/account/index";
import { supportLinkByTokenType } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Alert from "~/renderer/components/Alert";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import type { StepProps } from "..";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import FullNodeStatus from "~/renderer/modals/AddAccounts/FullNodeStatus";
import useSatStackStatus from "~/renderer/hooks/useSatStackStatus";
import useEnv from "~/renderer/hooks/useEnv";
import type { SatStackStatus } from "@ledgerhq/live-common/families/bitcoin/satstack";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const StepChooseCurrency = ({ currency, setCurrency }: StepProps) => {
  const osmo = useFeature("currencyOsmosis");
  const fantom = useFeature("currencyFantom");
  const moonbeam = useFeature("currencyMoonbeam");
  const cronos = useFeature("currencyCronos");
  const songbird = useFeature("currencySongbird");
  const flare = useFeature("currencyFlare");

  const featureFlaggedCurrencies = useMemo(
    () => ({
      osmo,
      fantom,
      moonbeam,
      cronos,
      songbird,
      flare,
    }),
    [osmo, fantom, moonbeam, cronos, songbird, flare],
  );

  const currencies = useMemo(() => {
    const currencies = listSupportedCurrencies().concat(listSupportedTokens());
    const deactivatedCurrencies = Object.entries(featureFlaggedCurrencies)
      .filter(([, feature]) => !feature?.enabled)
      .map(([name]) => name);

    return currencies.filter(c => !deactivatedCurrencies.includes(c.id));
  }, [featureFlaggedCurrencies]);

  const url =
    currency && currency.type === "TokenCurrency"
      ? supportLinkByTokenType[currency.tokenType]
      : null;

  return (
    <>
      {currency ? <CurrencyDownStatusAlert currencies={[currency]} /> : null}
      {/* $FlowFixMe: onChange type is not good */}
      <SelectCurrency currencies={currencies} autoFocus onChange={setCurrency} value={currency} />
      <FullNodeStatus currency={currency} />
      {currency && currency.type === "TokenCurrency" ? (
        <Alert type="primary" learnMoreUrl={url} mt={4}>
          <Trans
            i18nKey="addAccounts.tokensTip"
            values={{
              token: currency.name,
              ticker: currency.ticker,
              tokenType: currency.tokenType.toUpperCase(),
              currency: currency.parentCurrency.name,
            }}
          >
            <b></b>
          </Trans>
        </Alert>
      ) : null}
    </>
  );
};

export const StepChooseCurrencyFooter = ({
  transitionTo,
  currency,
  existingAccounts,
  onCloseModal,
  setCurrency,
}: StepProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isToken = currency && currency.type === "TokenCurrency";
  const satStackAlreadyConfigured = useEnv("SATSTACK");

  const latestStatus: ?SatStackStatus = useSatStackStatus();
  const fullNodeNotReady =
    satStackAlreadyConfigured &&
    !!(
      currency &&
      currency.type === "CryptoCurrency" &&
      currency.id === "bitcoin" &&
      latestStatus &&
      latestStatus.type !== "ready"
    );

  // $FlowFixMe
  const parentCurrency = isToken && currency.parentCurrency;

  // $FlowFixMe
  const accountData = isToken && findTokenAccountByCurrency(currency, existingAccounts);

  const parentTokenAccount = accountData ? accountData.parentAccount : null;

  const tokenAccount = accountData ? accountData.account : null;

  // specific cta in case of token accounts
  const onTokenCta = useCallback(() => {
    if (parentTokenAccount) {
      onCloseModal();
      dispatch(
        openModal(
          "MODAL_RECEIVE",
          tokenAccount // if already has token receive directly to it
            ? {
                account: tokenAccount,
                parentAccount: parentTokenAccount,
              }
            : {
                account: parentTokenAccount, // else receive to parent account
              },
        ),
      );
    } else if (parentCurrency) {
      // set parentCurrency in already opened add account flow and continue
      setCurrency(parentCurrency);
      transitionTo("connectDevice");
    }
  }, [
    parentTokenAccount,
    parentCurrency,
    onCloseModal,
    dispatch,
    setCurrency,
    tokenAccount,
    transitionTo,
  ]);
  return (
    <>
      <TrackPage category="AddAccounts" name="Step1" />
      {currency && <CurrencyBadge mr="auto" currency={currency} />}
      {isToken ? (
        <Box horizontal>
          {parentCurrency ? (
            <Button ml={2} primary onClick={onTokenCta} data-test-id="modal-continue-button">
              {parentTokenAccount
                ? t("addAccounts.cta.receive")
                : t("addAccounts.cta.addAccountName", {
                    currencyName: parentCurrency.name,
                  })}
            </Button>
          ) : null}
        </Box>
      ) : (
        <Button
          primary
          disabled={!currency || fullNodeNotReady}
          onClick={() => transitionTo("connectDevice")}
          data-test-id="modal-continue-button"
        >
          {t("common.continue")}
        </Button>
      )}
    </>
  );
};

export default StepChooseCurrency;

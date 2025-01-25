import React, { useCallback, useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { Alert, Link, Text } from "@ledgerhq/react-ui";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { Account } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { track } from "~/renderer/analytics/segment";
import { useHistory } from "react-router";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
import { openModal } from "~/renderer/actions/modals";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";

const NotEnoughFundsToUnstake = ({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) => {
  const currency = account.currency;
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const accountUnit = useAccountUnit(account);
  const accountCurrentBalance = formatCurrencyUnit(accountUnit, account.spendableBalance, {
    showCode: true,
    locale: locale,
  });
  const { data: currenciesAll } = useFetchCurrencyAll();
  const isAvailableOnSwap = useMemo(
    () => currenciesAll.includes(currency.id),
    [currency.id, currenciesAll],
  );
  const { isCurrencyAvailable } = useRampCatalog();
  const isAvailableOnBuy = !!currency && isCurrencyAvailable(currency.id, "onRamp");
  const history = useHistory();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const dispatch = useDispatch();

  const buttonSharedTrackingFields = useMemo(
    () => ({
      currency: currency.ticker,
      currencyName: currency.name,
      page: "UndelegateFlowModal",
    }),
    [currency],
  );

  const onPressBuy = useCallback(() => {
    track("button_clicked2", {
      button: "buy",
      ...buttonSharedTrackingFields,
    });
    history.push({
      pathname: "/exchange",
      state: {
        currency: currency.id,
        account: account.id,
        mode: "buy",
      },
    });
    onClose();
  }, [buttonSharedTrackingFields, history, currency.id, account?.id, onClose]);

  const onPressSwap = useCallback(() => {
    track("button_clicked2", {
      button: "swap",
      ...buttonSharedTrackingFields,
      ...swapDefaultTrack,
    });
    history.push({
      pathname: "/swap",
      state: {
        defaultCurrency: currency,
        defaultAccount: account,
        from: history.location.pathname,
      },
    });
    onClose();
  }, [buttonSharedTrackingFields, swapDefaultTrack, history, currency, account, onClose]);

  const onPressDeposit = useCallback(() => {
    onClose();
    track("button_clicked2", {
      button: "receive",
      ...buttonSharedTrackingFields,
    });
    dispatch(
      openModal("MODAL_RECEIVE", {
        account: account,
      }),
    );
  }, [account, buttonSharedTrackingFields, dispatch, onClose]);

  const ctasSupported = useMemo(() => {
    const ctas = [];
    if (isAvailableOnBuy) {
      ctas.push({
        label: t("errors.NotEnoughBalanceForUnstaking.ctas.buy"),
        component: <Link alwaysUnderline onClick={onPressBuy} />,
      });
    }
    if (isAvailableOnSwap) {
      ctas.push({
        label: t("errors.NotEnoughBalanceForUnstaking.ctas.swap"),
        component: <Link alwaysUnderline onClick={onPressSwap} />,
      });
    }
    ctas.push({
      label: t("errors.NotEnoughBalanceForUnstaking.ctas.deposit"),
      component: <Link alwaysUnderline onClick={onPressDeposit} />,
    });
    return ctas;
  }, [isAvailableOnBuy, isAvailableOnSwap, onPressBuy, onPressDeposit, onPressSwap, t]);

  const ctasKey =
    ctasSupported.length === 3
      ? "errors.NotEnoughBalanceForUnstaking.threeCtas"
      : ctasSupported.length === 2
        ? "errors.NotEnoughBalanceForUnstaking.twoCtas"
        : "errors.NotEnoughBalanceForUnstaking.oneCta";

  return (
    <Alert
      type="error"
      containerProps={{ p: 12, borderRadius: 8 }}
      renderContent={() => (
        <>
          <Text
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            {t("errors.NotEnoughBalanceForUnstaking.message", {
              currentBalance: accountCurrentBalance,
              assetName: accountUnit?.code,
            })}
          </Text>
          <Text
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            <Trans
              i18nKey={ctasKey}
              values={{
                assetName: accountUnit?.code,
                cta1Label: ctasSupported[0]?.label,
                cta2Label: ctasSupported[1]?.label,
                cta3Label: ctasSupported[2]?.label,
              }}
              components={{
                ...(ctasSupported[0] && { cta1: ctasSupported[0]?.component }),
                ...(ctasSupported[1] && { cta2: ctasSupported[1]?.component }),
                ...(ctasSupported[2] && { cta3: ctasSupported[2]?.component }),
              }}
            />
          </Text>
        </>
      )}
    />
  );
};
export default NotEnoughFundsToUnstake;

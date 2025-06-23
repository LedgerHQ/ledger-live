import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";
import Alert from "~/renderer/components/Alert";
import { Account } from "@ledgerhq/types-live/lib/account";
import { Flex } from "@ledgerhq/react-ui";
import TranslatedError from "~/renderer/components/TranslatedError";

type LowGasAlertBuyMoreProps = {
  account: Account;
  handleRequestClose: () => void;
  gasPriceError: Error | null;
  trackingSource: string;
};

/**
 * LowGasAlertBuyMore
 *
 * This component renders an alert message when the user has insufficient gas
 * to complete a transaction.
 * It also provides a call to action to buy more crypto,
 * handling redirection to the exchange flow.
 *
 * Usage:
 * <LowGasAlertBuyMore
 *    account={mainAccount}
 *    handleRequestClose={closeAllModal}
 *    gasPriceError={gasPriceError}
 *    trackingSource={"swap | send or whatever"}s
 * />
 *
 */
const LowGasAlertBuyMore = ({
  account,
  handleRequestClose,
  gasPriceError,
  trackingSource,
}: LowGasAlertBuyMoreProps) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const onBuyClick = useCallback(() => {
    dispatch(handleRequestClose());
    setTrackingSource(trackingSource);
    history.push({
      pathname: "/exchange",
      state: {
        currency: account.currency.id,
        account: account.id,
        mode: "buy",
      },
    });
  }, [account.currency.id, account.id, history, dispatch, handleRequestClose, trackingSource]);

  if (!gasPriceError) return null;
  return (
    <Flex onClick={isCurrencySupported("BUY", account.currency) ? onBuyClick : undefined}>
      <Alert type="warning" data-testid="insufficient-funds-warning">
        <TranslatedError error={gasPriceError} />
      </Alert>
    </Flex>
  );
};

export default LowGasAlertBuyMore;

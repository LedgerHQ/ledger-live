import { postSwapCancelled } from "@ledgerhq/live-common/exchange/swap/index";
import { setBroadcastTransaction } from "@ledgerhq/live-common/exchange/swap/setBroadcastTransaction";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import {
  Exchange,
  SwapTransactionType,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import {
  Footer as DeviceActionFooter,
  Header as DeviceActionHeader,
} from "~/renderer/components/DeviceAction/rendering";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useGetSwapTrackingProperties, useRedirectToSwapHistory } from "../../utils/index";
import { DrawerTitle } from "../DrawerTitle";
import { Separator } from "../Separator";
import SwapAction from "./SwapAction";
import SwapCompleted from "./SwapCompleted";
import { Operation } from "@ledgerhq/types-live";

const ContentBox = styled(Box)`
  ${DeviceActionHeader} {
    flex: 0;
  }
  ${DeviceActionFooter} {
    flex: 0;
  }
`;

type Props = {
  swapTransaction: SwapTransactionType;
  exchangeRate: ExchangeRate;
  onCompleteSwap?: () => void;
};

export default function ExchangeDrawer({ swapTransaction, exchangeRate, onCompleteSwap }: Props) {
  const dispatch = useDispatch();
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<{
    operation: Operation;
    swapId: string;
  } | null>(null);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const redirectToHistory = useRedirectToSwapHistory();
  const {
    transaction,
    swap: {
      from: { account: fromAccount, parentAccount: fromParentAccount, currency: sourceCurrency },
      to: { account: toAccount, parentAccount: toParentAccount, currency: targetCurrency },
    },
  } = swapTransaction;

  const exchange = useMemo(
    () => ({
      fromParentAccount,
      fromAccount,
      toParentAccount,
      toAccount,
    }),
    [fromAccount, fromParentAccount, toAccount, toParentAccount],
  ) as Exchange;

  const onError = useCallback(
    (errorResult: { error: Error; swapId?: string }) => {
      const { error, swapId } = errorResult;

      // Consider the swap as cancelled (on provider perspective) in case of error
      postSwapCancelled({
        provider: exchangeRate.provider,
        swapId: swapId ?? "",
      });
      track("error_message", {
        message: "drawer_error",
        page: "Page Swap Drawer",
        ...swapDefaultTrack,
        error,
      });
      setError(error);
    },
    [exchangeRate.provider, swapDefaultTrack],
  );

  const onCompletion = useCallback(
    (result: { operation: Operation; swapId: string }) => {
      const { magnitudeAwareRate, provider } = exchangeRate;
      setBroadcastTransaction({
        result,
        provider,
      });
      const params = getUpdateAccountWithUpdaterParams({
        result,
        exchange,
        transaction,
        magnitudeAwareRate,
        provider,
      });
      if (!params.length) return;
      const dispatchAction = updateAccountWithUpdater(...params);
      dispatch(dispatchAction);
      setResult(result);
      onCompleteSwap && onCompleteSwap();
    },
    [dispatch, exchange, exchangeRate, transaction, onCompleteSwap],
  );

  const onViewDetails = useCallback(
    () => {
      if (!result) return;
      const { operation } = result;
      const concernedOperation = operation
        ? operation.subOperations && operation.subOperations.length > 0
          ? operation.subOperations[0]
          : operation
        : null;
      if (fromAccount && concernedOperation) {
        redirectToHistory({
          swapId: result?.swapId,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fromAccount, fromParentAccount, result?.operation],
  );

  const closeDrawer = useCallback(() => setDrawer(), []);

  if (error) {
    return (
      <Box height="100%" justifyContent="space-between">
        <TrackPage
          category="Swap"
          name={`ModalStep-confirmationfail`}
          sourceCurrency={sourceCurrency?.name}
          targetCurrency={targetCurrency?.name}
          provider={exchangeRate.provider}
          {...swapDefaultTrack}
        />
        <Box justifyContent="center" flex={1} mx={3}>
          <ErrorDisplay error={error} />
        </Box>
        <Box flex={0}>
          <Separator noMargin />
          <Box
            style={{
              flexDirection: "row-reverse",
            }}
            px={24}
            pt={16}
          >
            <Button primary onClick={closeDrawer}>
              <Trans i18nKey="common.retry" />
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
  if (result) {
    return (
      <Box height="100%" justifyContent="space-between">
        <TrackPage
          category="Swap"
          name={`ModalStep-finished`}
          sourceCurrency={sourceCurrency?.name}
          targetCurrency={targetCurrency?.name}
          provider={exchangeRate.provider}
          {...swapDefaultTrack}
        />
        {targetCurrency && (
          <Box justifyContent="center" flex={1} mx={3}>
            <SwapCompleted
              swapId={result.swapId}
              provider={exchangeRate.provider}
              targetCurrency={targetCurrency?.name}
            />
          </Box>
        )}
        <Box flex={0}>
          <Separator noMargin />
          <Box
            style={{
              flexDirection: "row-reverse",
            }}
            px={24}
            pt={16}
          >
            <Button primary onClick={onViewDetails}>
              <Trans i18nKey="swap2.exchangeDrawer.completed.seeDetails" />
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box height="100%">
      <DrawerTitle i18nKey="swap2.exchangeDrawer.title" />
      <ContentBox flex={1}>
        <SwapAction
          swapTransaction={swapTransaction}
          exchangeRate={exchangeRate}
          onCompletion={onCompletion}
          onError={onError}
        />
      </ContentBox>
    </Box>
  );
}

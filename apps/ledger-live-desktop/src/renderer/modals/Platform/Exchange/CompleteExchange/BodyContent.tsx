import React from "react";
import { Exchange } from "@ledgerhq/live-common/exchange/types";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import { Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import DeviceAction from "~/renderer/components/DeviceAction";
import BigSpinner from "~/renderer/components/BigSpinner";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { TransactionBroadcastedContent } from "./TransactionBroadcastedContent";
import { ExchangeMode } from "./Body";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";

const exchangeAction = createAction(completeExchange);

export type BodyContentProps = {
  error?: Error;
  signedOperation?: SignedOperation;
  signRequest?: {
    tokenCurrency: TokenCurrency | undefined;
    parentAccount: Account | null | undefined;
    account: AccountLike;
    transaction: Transaction;
    appName: string;
  } | null;
  request: {
    provider: string;
    exchange: Exchange;
    transaction: Transaction;
    binaryPayload: string;
    signature: string;
    exchangeType: number;
    rateType?: number;
    amountExpectedTo?: number;
  };
  result?: {
    swapId?: string;
    mode: ExchangeMode;
    provider: string;
    sourceCurrency: Currency;
    targetCurrency?: Currency;
  };
  onOperationSigned: (value: SignedOperation) => void;
  onTransactionComplete: (value: Transaction) => void;
  onViewDetails: (id: string) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
};

export const BodyContent = (props: BodyContentProps) => {
  const action = useTransactionAction();

  if (props.error) {
    return <ErrorDisplay error={props.error} />;
  }

  if (props.result) {
    return (
      <TransactionBroadcastedContent
        swapId={props.result.swapId}
        mode={props.result.mode}
        provider={props.result.provider}
        sourceCurrency={props.result.sourceCurrency}
        targetCurrency={props.result.targetCurrency}
        onViewDetails={props.onViewDetails}
      />
    );
  }

  if (props.signedOperation) {
    return <BigSpinner size={40} />;
  }

  if (props.signRequest) {
    return (
      <DeviceAction
        key="sign"
        action={action}
        request={props.signRequest}
        onResult={result => {
          if ("transactionSignError" in result) {
            props.onError(result.transactionSignError);
          } else {
            props.onOperationSigned(result.signedOperation);
          }
        }}
      />
    );
  }

  return (
    <DeviceAction
      key="completeExchange"
      action={exchangeAction}
      request={props.request}
      onResult={result => {
        if ("completeExchangeError" in result) {
          props.onError(result.completeExchangeError);
        } else {
          props.onTransactionComplete(result.completeExchangeResult);
        }
      }}
    />
  );
};

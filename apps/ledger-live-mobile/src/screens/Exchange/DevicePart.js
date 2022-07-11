// @flow

import React, { useCallback, useMemo, useState } from "react";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import type {
  AccountLike,
  Account,
  Transaction,
} from "@ledgerhq/live-common/types/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { createAction as initSellCreateAction } from "@ledgerhq/live-common/hw/actions/initSell";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import getTransactionId from "@ledgerhq/live-common/exchange/sell/getTransactionId";
import { from, Observable } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import type { SellRequestEvent } from "@ledgerhq/live-common/exchange/sell/types";
import checkSignatureAndPrepare from "@ledgerhq/live-common/exchange/sell/checkSignatureAndPrepare";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import type { Device } from "@ledgerhq/hw-transport";
import { useTranslation } from "react-i18next";
import DeviceAction from "../../components/DeviceAction";
import { useBroadcast } from "../../components/useBroadcast";
import { renderError } from "../../components/DeviceAction/rendering";

const initSellExec = ({
  deviceId,
}: {
  deviceId: string,
}): Observable<SellRequestEvent> =>
  withDevice(deviceId)(transport => from(getTransactionId(transport)));

const action = createAction(connectApp);

const checkSignatureAndPrepareCmd = ({
  deviceId,
  transaction,
  binaryPayload,
  payloadSignature,
  account,
  parentAccount,
  status,
}: {
  deviceId: string,
  transaction: Transaction,
  binaryPayload: *,
  payloadSignature: *,
  account: AccountLike,
  parentAccount: ?Account,
  status: *,
}): Observable<SellRequestEvent> =>
  withDevice(deviceId)(transport =>
    from(
      checkSignatureAndPrepare(transport, {
        binaryPayload,
        account,
        parentAccount: parentAccount || undefined,
        status,
        payloadSignature,
        transaction,
      }),
    ),
  );

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  getCoinifyContext: string => Promise<any>,
  device: Device,
  onResult: (bool?: boolean) => void,
};

export function DevicePart({
  account,
  parentAccount,
  getCoinifyContext,
  device,
  onResult,
}: Props) {
  const { t } = useTranslation();

  const tokenCurrency =
    account && account.type === "TokenAccount" ? account.token : null;
  const [sellData, setSellData] = useState(null);
  const [error, setError] = useState(null);
  const broadcast = useBroadcast({ account, parentAccount });

  const handleTransactionId = useCallback(
    async (nonce: string) => {
      const mainAccount = getMainAccount(account, parentAccount);
      const mainCurrency = getAccountCurrency(mainAccount);

      const coinifyContext = await getCoinifyContext(nonce);

      const bridge = getAccountBridge(account, parentAccount);
      const t1 = bridge.createTransaction(mainAccount);

      const t2 = bridge.updateTransaction(t1, {
        amount: parseCurrencyUnit(
          mainCurrency.units[0],
          coinifyContext.inAmount.toString(10),
        ),
        recipient: coinifyContext.transferIn.details.account,
      });
      const t3 = await bridge.prepareTransaction(mainAccount, t2);
      const s = await bridge.getTransactionStatus(mainAccount, t3);

      if (s.errors && s.errors.amount) {
        setError(s.errors.amount);
      }

      return {
        binaryPayload: coinifyContext.providerSig.payload,
        payloadSignature: coinifyContext.providerSig.signature,
        transaction: t3,
        status: s,
      };
    },
    [getCoinifyContext, account, parentAccount],
  );

  const action2 = useMemo(
    () =>
      initSellCreateAction(
        connectApp,
        ({ deviceId }) =>
          initSellExec({
            deviceId,
          }),
        ({
          deviceId,
          transaction,
          binaryPayload,
          payloadSignature,
          account,
          parentAccount,
          status,
        }) =>
          checkSignatureAndPrepareCmd({
            deviceId,
            transaction,
            binaryPayload,
            payloadSignature,
            account,
            parentAccount: parentAccount || undefined,
            status,
          }),
        handleTransactionId,
      ),
    [handleTransactionId],
  );

  if (error) {
    return renderError({ t, error, onRetry: () => onResult(false) });
  }

  // When the device is done with the sell init
  if (!sellData) {
    return (
      <DeviceAction
        action={action2}
        device={device}
        request={{
          parentAccount,
          account,
        }}
        onResult={({ initSellResult, initSellError }) => {
          if (initSellError) {
            if (initSellError.statusCode === 27268) {
              onResult(false);
              return;
            }
            setError(initSellError);
          } else {
            setSellData(initSellResult);
          }
        }}
      />
    );
  }

  // About to broadcast
  return (
    <DeviceAction
      key={"send"}
      action={action}
      device={device}
      // $FlowFixMe
      request={{
        tokenCurrency,
        parentAccount,
        account,
        transaction: sellData.transaction,
        appName: "Exchange",
      }}
      onResult={({ signedOperation, transactionSignError }) => {
        if (transactionSignError) {
          setError(transactionSignError);
        } else {
          broadcast(signedOperation).then(() => {
            onResult(true);
          });
        }
      }}
    />
  );
}

// @flow
import React, { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getEnv } from "@ledgerhq/live-common/env";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { createAction } from "@ledgerhq/live-common/hw/actions/transaction";
import DeviceAction from "~/renderer/components/DeviceAction";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import Box from "~/renderer/components/Box";
import { Trans, useTranslation } from "react-i18next";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import StepProgress from "~/renderer/components/StepProgress";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import BigSpinner from "~/renderer/components/BigSpinner";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { createAction as initSellCreateAction } from "@ledgerhq/live-common/hw/actions/initSell";
import { renderError } from "~/renderer/components/DeviceAction/rendering";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import checkSignatureAndPrepare from "@ledgerhq/live-common/exchange/sell/checkSignatureAndPrepare";
import { from } from "rxjs";
import getTransactionId from "@ledgerhq/live-common/exchange/sell/getTransactionId";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = {
  onClose: () => void,
  data: {
    account: AccountLike,
    parentAccount: ?Account,
    onResult: () => null,
    onCancel: () => null,
    verifyAddress?: boolean,
    getCoinifyContext: string => Promise<any>,
  },
};

const Result = ({
  signedOperation,
  device,
}: {
  signedOperation: ?SignedOperation,
  device: Device,
}) => {
  if (!signedOperation) return null;
  return (
    <StepProgress modelId={device.modelId}>
      <DeviceBlocker />
      <Trans i18nKey="send.steps.confirmation.pending.title" />
    </StepProgress>
  );
};

const Root = ({ data, onClose }: Props) => {
  const { account, parentAccount, getCoinifyContext, onResult, onCancel } = data;

  const { t } = useTranslation();

  const tokenCurrency = account && account.type === "TokenAccount" && account.token;

  // state
  const [sellData, setSellData] = useState(null);
  const [error, setError] = useState(null);
  const [signedOperation, setSignedOperation] = useState(null);

  const broadcast = useBroadcast({ account, parentAccount });

  const handleTransactionId = useCallback(
    async (nonce: string) => {
      const mainAccount = getMainAccount(account, parentAccount);
      const mainCurrency = getAccountCurrency(mainAccount);

      const coinifyContext = await getCoinifyContext(nonce);

      const bridge = getAccountBridge(account, parentAccount);
      const t1 = bridge.createTransaction(mainAccount);

      const t2 = bridge.updateTransaction(t1, {
        amount: parseCurrencyUnit(mainCurrency.units[0], coinifyContext.inAmount.toString(10)),
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
        getEnv("MOCK") ? mockedEventEmitter : connectApp,
        getEnv("MOCK")
          ? mockedEventEmitter
          : ({ deviceId }) => withDevice(deviceId)(transport => from(getTransactionId(transport))),
        ({
          deviceId,
          transaction,
          binaryPayload,
          payloadSignature,
          account,
          parentAccount,
          status,
        }) =>
          withDevice(deviceId)(transport =>
            from(
              checkSignatureAndPrepare(transport, {
                binaryPayload,
                account,
                parentAccount,
                status,
                payloadSignature,
                transaction,
              }),
            ),
          ),

        handleTransactionId,
      ),
    [handleTransactionId],
  );

  if (error) {
    return (
      <Box alignItems={"center"} justifyContent={"center"} p={20}>
        {renderError({
          t,
          error,
        })}
      </Box>
    );
  }

  // If the TX is signed by the device
  if (signedOperation) {
    return (
      <Box alignItems={"center"} justifyContent={"center"} p={20}>
        <BigSpinner size={40} />
      </Box>
    );
  }

  // When the device is done with the sell init
  if (!sellData) {
    return (
      <DeviceAction
        action={action2}
        request={{
          parentAccount,
          account,
        }}
        Result={Result}
        onResult={({ initSellResult, initSellError, ...rest }) => {
          if (initSellError) {
            if (initSellError.statusCode === 27268) {
              // this mean the user declined the trade on device
              onCancel();
              onClose();
              return;
            }
            setError(initSellError);
          } else {
            setSellData(initSellResult);
          }
        }}
        analyticsPropertyFlow="sell"
      />
    );
  }

  // About to broadcast
  return (
    <DeviceAction
      key={"send"}
      action={action}
      request={{
        tokenCurrency,
        parentAccount,
        account,
        transaction: sellData.transaction,
        appName: "Exchange",
      }}
      Result={Result}
      onResult={({ signedOperation, transactionSignError }) => {
        if (transactionSignError) {
          setError(transactionSignError);
        } else {
          setSignedOperation(signedOperation);
          broadcast(signedOperation).then(() => {
            onResult();
            onClose();
          });
        }
      }}
      analyticsPropertyFlow="sell"
    />
  );
};

const SellCrypto = () => {
  const { t } = useTranslation();

  return (
    <Modal
      name="MODAL_SELL_CRYPTO_DEVICE"
      centered
      render={({ data, onClose }) => (
        <ModalBody
          onClose={() => {
            if (data.onCancel) {
              data.onCancel();
            }
            onClose();
          }}
          title={t("common.connectDevice")}
          render={() => (data ? <Root data={data} onClose={onClose} /> : null)}
        />
      )}
    />
  );
};

export default SellCrypto;

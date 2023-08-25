import React, { useEffect, useMemo, useState } from "react";
import { Exchange } from "@ledgerhq/live-common/exchange/platform/types";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { BodyContent } from "./BodyContent";

export type Data = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  onResult: (a: Operation) => void;
  onCancel: (a: Error) => void;
  exchangeType: number;
  rateType?: number;
};

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const { onResult, onCancel, ...exchangeParams } = data;
  const { fromAccount: account, fromParentAccount: parentAccount } = exchangeParams.exchange;
  const request = { ...exchangeParams };

  const tokenCurrency: TokenCurrency | undefined =
    account.type === "TokenAccount" ? account.token : undefined;

  const broadcast = useBroadcast({ account, parentAccount });
  const [transaction, setTransaction] = useState<Transaction>();
  const [signedOperation, setSignedOperation] = useState<SignedOperation>();
  const [error, setError] = useState<Error>();

  const signRequest = useMemo(
    () =>
      transaction
        ? {
            tokenCurrency,
            parentAccount,
            account,
            transaction,
            appName: "Exchange",
          }
        : null,
    [account, parentAccount, tokenCurrency, transaction],
  );

  useEffect(() => {
    if (error) {
      onCancel(error);
    }
  }, [onCancel, error]);

  useEffect(() => {
    if (signedOperation) {
      broadcast(signedOperation).then(operation => {
        onResult(operation);
        onClose?.();
      }, setError);
    }
  }, [broadcast, onClose, onResult, signedOperation]);

  return (
    <ModalBody
      onClose={() => {
        onCancel(new Error("Interrupted by user"));
        onClose?.();
      }}
      render={() => (
        <Box alignItems={"center"} justifyContent={"center"} px={32}>
          <BodyContent
            error={error}
            signRequest={signRequest}
            signedOperation={signedOperation}
            request={request}
            onError={setError}
            onOperationSigned={setSignedOperation}
            onTransactionComplete={setTransaction}
          />
        </Box>
      )}
    />
  );
};

export default Body;

import React, { useSyncExternalStore } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getPendingSignRequest, subscribePendingSignRequest } from "./pendingSignRequest";
import { MessageSign } from "./screens/MessageSign";
import { Receive } from "./screens/Receive";
import { TransactionSign } from "./screens/TransactionSign";
import { selectIsWalletApiAccountDataSignDialogOpen } from "./walletApiAccountDataSignDialog";

/** A Wallet API request the account data serves: review, then the device. */
const WalletAPIAccountDataSignDialog = () => {
  const isOpen = useSelector(selectIsWalletApiAccountDataSignDialogOpen);
  const request = useSyncExternalStore(subscribePendingSignRequest, getPendingSignRequest);
  if (!isOpen || !request) return null;

  switch (request.kind) {
    case "transaction":
      return <TransactionSign key={request.id} requestId={request.id} params={request.params} />;
    case "message":
      return <MessageSign key={request.id} requestId={request.id} params={request.params} />;
    case "receive":
      return <Receive key={request.id} requestId={request.id} params={request.params} />;
  }
};

export default WalletAPIAccountDataSignDialog;

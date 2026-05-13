import React from "react";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import Modal from "~/renderer/components/Modal";
import { ModalLayout } from "./ModalLayout";
import { SwapTransactionStatusView } from "./SwapTransactionStatusView";
import { useSwapTransactionStatus } from "./useSwapTransactionStatus";

const MODAL_WIDTH = 400;

function SwapTransactionStatusContent({
  params,
  onClose,
}: {
  params: SwapTransactionStatusParams;
  onClose: () => void;
}) {
  const viewModel = useSwapTransactionStatus(params);

  return (
    <ModalLayout onClose={onClose}>
      <SwapTransactionStatusView params={params} viewModel={viewModel} />
    </ModalLayout>
  );
}

function MODAL_SWAP_TRANSACTION_STATUS() {
  return (
    <Modal
      name="MODAL_SWAP_TRANSACTION_STATUS"
      centered
      width={MODAL_WIDTH}
      preventBackdropClick
      render={({ data, onClose }) =>
        data ? <SwapTransactionStatusContent params={data} onClose={onClose} /> : null
      }
    />
  );
}

export default MODAL_SWAP_TRANSACTION_STATUS;

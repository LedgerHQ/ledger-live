import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal, closeModal } from "~/renderer/actions/modals";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import BigNumber from "bignumber.js";

export type CardanoUndelegateSelfTxInfoModalProps = {
  account: CardanoAccount;
};

// used for internal transaction
const DEFAULT_TX_AMOUNT = 2000000;

export default function CardanoUndelegateSelfTxInfoModal({
  account,
}: CardanoUndelegateSelfTxInfoModalProps) {
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal("MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO"));
    dispatch(
      openModal("MODAL_SEND", {
        account,
        recipient: account.freshAddress,
        amount: BigNumber(DEFAULT_TX_AMOUNT),
      }),
    );
  }, [account, dispatch]);

  return (
    <Modal
      name="MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO"
      centered
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="cardano.unDelegation.selfTransactionFlow.title" />}
          onClose={onClose}
          render={() => (
            <Box mx={4}>
              <Box flow={1} alignItems="center">
                <Box mb={4}>
                  <Text
                    ff="Inter|SemiBold"
                    fontSize={13}
                    textAlign="left"
                    color="palette.text.shade80"
                    style={{
                      lineHeight: 1.57,
                    }}
                  >
                    <p>
                      <Trans i18nKey="cardano.unDelegation.selfTransactionFlow.steps.starter.description.0" />
                    </p>
                    <br />
                    <p>
                      <Trans i18nKey="cardano.unDelegation.selfTransactionFlow.steps.starter.description.1" />
                    </p>
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
          renderFooter={() => (
            <Box horizontal>
              <Button ml={2} onClick={onClose}>
                <Trans i18nKey="common.cancel" />
              </Button>
              <Button
                ml={2}
                primary
                onClick={onNext}
                data-testid="modal-continue-button"
                name="continue"
              >
                {<Trans i18nKey="common.continue" />}
              </Button>
            </Box>
          )}
        />
      )}
    />
  );
}

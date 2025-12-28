import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { urls } from "~/config/urls";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import ModalFooter from "~/renderer/components/Modal/ModalFooter";
import Text from "~/renderer/components/Text";
import Error from "~/renderer/icons/Error";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

type Props = Readonly<{
  account: Account;
}>;

const CANTON_REASONABLE_CONSOLIDATE_MULTIPLIER = 0.4;

export default function TooManyUtxosModal({ account }: Props) {
  const dispatch = useDispatch();
  const learnMoreUrl = useLocalizedUrl(urls.canton.learnMore);
  const cantonAccount = account as CantonAccount;

  const handleOpenSendFlow = useCallback(() => {
    dispatch(closeModal("MODAL_CANTON_TOO_MANY_UTXOS"));
    dispatch(
      openModal("MODAL_SEND", {
        account: cantonAccount,
        recipient: cantonAccount.xpub,
        amount: cantonAccount.spendableBalance.multipliedBy(
          CANTON_REASONABLE_CONSOLIDATE_MULTIPLIER,
        ),
        stepId: "amount",
      }),
    );
  }, [dispatch, cantonAccount]);

  const handleLearnMore = useCallback(() => {
    openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return (
    <Modal
      centered
      name="MODAL_CANTON_TOO_MANY_UTXOS"
      render={({ onClose }) => (
        <>
          <ModalBody
            onClose={onClose}
            title=""
            render={() => (
              <Box p={4} alignItems="center" justifyContent="center">
                <Box mb={4} alignItems="center">
                  <Error size={48} color="orange" />
                </Box>

                <Text
                  ff="Inter|SemiBold"
                  fontSize={6}
                  color="neutral.c100"
                  textAlign="center"
                  mb={3}
                >
                  <Trans i18nKey="families.canton.tooManyUtxos.title" />
                </Text>

                <Text ff="Inter|Regular" fontSize={4} color="neutral.c80" textAlign="center" mb={4}>
                  <Trans i18nKey="families.canton.tooManyUtxos.description" />
                </Text>

                <Text
                  ff="Inter|SemiBold"
                  fontSize={4}
                  color="neutral.c100"
                  textAlign="center"
                  mb={4}
                >
                  <Trans i18nKey="families.canton.tooManyUtxos.quickFix" />
                </Text>
              </Box>
            )}
          />
          <ModalFooter>
            <Box pl={2}>
              <LinkWithExternalIcon onClick={handleLearnMore}>
                <Trans i18nKey="common.learnMore" />
              </LinkWithExternalIcon>
            </Box>
            <Box horizontal alignItems="center" justifyContent="space-between" grow></Box>
            <Button primary onClick={handleOpenSendFlow}>
              <Trans i18nKey="families.canton.tooManyUtxos.consolidate" />
            </Button>
          </ModalFooter>
        </>
      )}
    />
  );
}

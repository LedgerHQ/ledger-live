import React, { useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { Flex, Text, Button, Box } from "@ledgerhq/native-ui";
import Clipboard from "@react-native-clipboard/clipboard";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton";
import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import QueuedDrawer from "~/components/QueuedDrawer";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import FormatDate from "~/components/DateFormat/FormatDate";
import { type TransferProposalAction } from "./types";

type PendingProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  memo: string;
  expires_at_micros: number;
  isExpired: boolean;
};

type Props = {
  account: Account;
  parentAccount: Account;
  contractId: string;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  isOpen: boolean;
  onClose?: () => void;
};

const PendingTransferProposalsDetails: React.FC<Props> = ({
  account,
  parentAccount,
  contractId,
  onOpenModal,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);

  const cantonAccount: CantonAccount | null = isCantonAccount(account) ? account : null;
  const proposal = useMemo<PendingProposal | null>(() => {
    const pendingTransferProposals = cantonAccount?.cantonResources?.pendingTransferProposals || [];
    const found = pendingTransferProposals.find(p => p.contract_id === contractId);
    if (!found) return null;

    const now = Date.now();
    const isExpired = now > found.expires_at_micros / 1000;
    return {
      ...found,
      isExpired,
      amount: new BigNumber(found.amount),
    };
  }, [cantonAccount, contractId]);

  const handleAcceptOffer = useCallback(
    (contractId: string) => {
      onOpenModal(contractId, "accept");
    },
    [onOpenModal],
  );

  const handleRejectOffer = useCallback(
    (contractId: string) => {
      onOpenModal(contractId, "reject");
    },
    [onOpenModal],
  );

  const handleWithdrawOffer = useCallback(
    (contractId: string) => {
      onOpenModal(contractId, "withdraw");
    },
    [onOpenModal],
  );

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
  }, []);

  const timeRemaining = useTimeRemaining(proposal?.expires_at_micros, proposal?.isExpired);

  if (!proposal) {
    return (
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
        <Box p={4}>
          <Text>{t("common.notFound")}</Text>
        </Box>
      </QueuedDrawer>
    );
  }

  const isIncoming = proposal.sender !== parentAccount.xpub;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      title={t(
        isIncoming
          ? "canton.pendingTransactions.details.incomingTitle"
          : "canton.pendingTransactions.details.outgoingTitle",
      )}
    >
      <Flex flexDirection="column" px={6} py={4}>
        <Flex mb={8}>
          <Text variant="paragraph" color="neutral.c70" mb={2}>
            {t("canton.pendingTransactions.amount")}
          </Text>
          <Text
            variant="body"
            fontWeight="semiBold"
            color={isIncoming ? "success.c50" : "neutral.c70"}
          >
            <CurrencyUnitValue
              unit={unit}
              value={isIncoming ? proposal.amount : proposal.amount.negated()}
              showCode
              alwaysShowSign
            />
          </Text>
        </Flex>

        <Flex mb={8}>
          <Text variant="paragraph" color="neutral.c70" mb={2}>
            {t("canton.pendingTransactions.from")}
          </Text>
          <TouchableOpacity onPress={() => handleCopy(proposal.sender)}>
            <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
              {proposal.sender}
            </Text>
          </TouchableOpacity>
        </Flex>

        <Flex mb={8}>
          <Text variant="paragraph" color="neutral.c70" mb={2}>
            {t("canton.pendingTransactions.to")}
          </Text>
          <TouchableOpacity onPress={() => handleCopy(proposal.receiver)}>
            <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
              {proposal.receiver}
            </Text>
          </TouchableOpacity>
        </Flex>

        {proposal.memo && (
          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.memo")}
            </Text>
            <Text variant="body" color="neutral.c100">
              {proposal.memo}
            </Text>
          </Flex>
        )}

        <Flex mb={8}>
          <Text variant="paragraph" color="neutral.c70" mb={2}>
            {t("canton.pendingTransactions.expiresAt")}
          </Text>
          <Text variant="body" color="neutral.c100">
            <FormatDate date={new Date(proposal.expires_at_micros / 1000)} />
          </Text>
        </Flex>

        {!proposal.isExpired && timeRemaining && (
          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.expiresIn")}
            </Text>
            <Text variant="body" color="neutral.c100">
              {timeRemaining}
            </Text>
          </Flex>
        )}

        {proposal.isExpired && (
          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.status.label")}
            </Text>
            <Text variant="body" color="error.c50">
              {t("canton.pendingTransactions.expired")}
            </Text>
          </Flex>
        )}

        <Flex mb={8}>
          <Text variant="paragraph" color="neutral.c70" mb={2}>
            {t("canton.pendingTransactions.deviceAppModal.contractId")}
          </Text>
          <TouchableOpacity onPress={() => handleCopy(proposal.contract_id)}>
            <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
              {proposal.contract_id}
            </Text>
          </TouchableOpacity>
        </Flex>

        <Flex flexDirection="row" mt={4} justifyContent="center" columnGap={8}>
          {isIncoming ? (
            <>
              {!proposal.isExpired && (
                <Button
                  type="shade"
                  onPress={() => handleAcceptOffer(proposal.contract_id)}
                  iconName="CheckAlone"
                  flex={1}
                >
                  <Trans i18nKey="canton.pendingTransactions.accept" />
                </Button>
              )}
              <Button
                outline
                type="main"
                onPress={() => handleRejectOffer(proposal.contract_id)}
                iconName="Close"
                flex={1}
              >
                <Trans i18nKey="canton.pendingTransactions.reject" />
              </Button>
            </>
          ) : (
            <Button
              outline
              type="main"
              iconName="Close"
              onPress={() => handleWithdrawOffer(proposal.contract_id)}
              flex={1}
            >
              <Trans i18nKey="canton.pendingTransactions.withdraw" />
            </Button>
          )}
        </Flex>
      </Flex>
    </QueuedDrawer>
  );
};

export default PendingTransferProposalsDetails;

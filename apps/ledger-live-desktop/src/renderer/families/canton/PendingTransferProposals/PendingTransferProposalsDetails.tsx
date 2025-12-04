import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import FormattedVal from "~/renderer/components/FormattedVal";
import IconCheck from "~/renderer/icons/Check";
import IconCross from "~/renderer/icons/Cross";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import {
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsData,
  B,
  HashContainer,
  GradientHover,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import { dayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import type { TransferProposalAction } from "./types";

type PendingProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  memo: string;
  expires_at_micros: number;
  isExpired: boolean;
};

export type PendingTransferProposalsDetailsProps = {
  onClose?: () => void;
  account: Account;
  contractId: string;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

const PendingTransferProposalsDetails: React.FC<PendingTransferProposalsDetailsProps> = ({
  account,
  contractId,
  onClose,
  onOpenModal,
}) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);

  const cantonAccount = account as CantonAccount;
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
      // Close drawer after modal state is set
      setTimeout(() => {
        onClose?.();
      }, 0);
    },
    [onClose, onOpenModal],
  );

  const handleRejectOffer = useCallback(
    (contractId: string) => {
      onOpenModal(contractId, "reject");
      // Close drawer after modal state is set
      setTimeout(() => {
        onClose?.();
      }, 0);
    },
    [onClose, onOpenModal],
  );

  const handleWithdrawOffer = useCallback(
    (contractId: string) => {
      onOpenModal(contractId, "withdraw");
      // Close drawer after modal state is set
      setTimeout(() => {
        onClose?.();
      }, 0);
    },
    [onClose, onOpenModal],
  );

  const formatDate = useDateFormatter(dayFormat);
  const dateFormatted = useMemo(
    () => formatDate(new Date(proposal?.expires_at_micros ?? 0)),
    [proposal?.expires_at_micros, formatDate],
  );
  const timeRemaining = useTimeRemaining(proposal?.expires_at_micros, proposal?.isExpired);

  if (!proposal) {
    return (
      <Box p={4}>
        <Text>{t("common.notFound")}</Text>
      </Box>
    );
  }

  const isIncoming = proposal.sender !== account.xpub;

  return (
    <Box flow={3} px={20} mt={20}>
      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.amount")}</OpDetailsTitle>
        <OpDetailsData>
          <Box alignItems="flex-end">
            <FormattedVal
              val={isIncoming ? proposal.amount : proposal.amount.negated()}
              unit={unit}
              showCode
              fontSize={4}
              alwaysShowSign
              color={isIncoming ? undefined : "palette.text.shade80"}
            />
          </Box>
        </OpDetailsData>
      </OpDetailsSection>

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.from")}</OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.sender} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.sender} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.to")}</OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.receiver} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.receiver} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      {proposal.memo && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.memo")}</OpDetailsTitle>
          <OpDetailsData>{proposal.memo}</OpDetailsData>
        </OpDetailsSection>
      )}

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.expiresAt")}</OpDetailsTitle>
        <OpDetailsData>{dateFormatted}</OpDetailsData>
      </OpDetailsSection>

      {!proposal.isExpired && timeRemaining && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.expiresIn")}</OpDetailsTitle>
          <OpDetailsData>{timeRemaining}</OpDetailsData>
        </OpDetailsSection>
      )}

      {proposal.isExpired && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.status.label")}</OpDetailsTitle>
          <OpDetailsData color="alertRed">
            {t("families.canton.pendingTransactions.expired")}
          </OpDetailsData>
        </OpDetailsSection>
      )}

      <B />

      <OpDetailsSection>
        <OpDetailsTitle>
          {t("families.canton.pendingTransactions.deviceAppModal.contractId")}
        </OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.contract_id} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.contract_id} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      <B />

      <Box horizontal mt={4} flow={2} justifyContent="center">
        {isIncoming ? (
          <>
            <Button
              primary
              disabled={proposal.isExpired}
              onClick={() => {
                if (!proposal.isExpired) {
                  handleAcceptOffer(proposal.contract_id);
                }
              }}
              style={{ minWidth: "120px", textTransform: "uppercase" }}
            >
              <IconCheck size={16} />
              <Box ml={1}>{t("families.canton.pendingTransactions.accept")}</Box>
            </Button>
            <Button
              outline
              onClick={() => handleRejectOffer(proposal.contract_id)}
              style={{ minWidth: "120px", textTransform: "uppercase" }}
            >
              <IconCross size={16} />
              <Box ml={1}>{t("families.canton.pendingTransactions.reject")}</Box>
            </Button>
          </>
        ) : (
          <Button
            primary
            onClick={() => handleWithdrawOffer(proposal.contract_id)}
            style={{ minWidth: "120px", textTransform: "uppercase" }}
          >
            <IconCheck size={16} />
            <Box ml={1}>{t("families.canton.pendingTransactions.withdraw")}</Box>
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PendingTransferProposalsDetails;

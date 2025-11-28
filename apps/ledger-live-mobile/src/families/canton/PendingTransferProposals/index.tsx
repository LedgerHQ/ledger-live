import React, { useCallback, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import {
  useTimeRemaining,
  useCantonAcceptOrRejectOffer,
} from "@ledgerhq/live-common/families/canton/react";
import PendingTransferProposalsDetails from "./PendingTransferProposalsDetails";
import DeviceAppModal from "./DeviceAppModal";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import Touchable from "~/components/Touchable";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import { hoursAndMinutesOptionsSelector } from "~/components/DateFormat/FormatDate";
import SectionHeader from "~/components/SectionHeader";
import IconReceive from "~/icons/Receive";
import IconClose from "~/icons/Close";
import ArrowRight from "~/icons/ArrowRight";

type Props = {
  account: Account;
};

type Action = "accept" | "reject" | "withdraw";

type ProcessedProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  instrument_id: string;
  memo: string;
  expires_at_micros: number;
  isExpired: boolean;
  isIncoming: boolean;
  expiresAt: Date;
  day: Date;
};

type GroupedProposals = Array<{
  day: Date;
  proposals: ProcessedProposal[];
}>;

const PendingTransferProposals: React.FC<Props> = ({ account }) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const sync = useBridgeSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [modalAction, setModalAction] = useState<Action>("accept");
  const [modalContractId, setModalContractId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: account.currency,
    account,
    partyId: account.xpub || "",
  });

  const cantonAccount: CantonAccount | null = isCantonAccount(account) ? account : null;
  const pendingTransferProposals = useMemo(() => {
    return cantonAccount?.cantonResources?.pendingTransferProposals || [];
  }, [cantonAccount]);

  const startOfDay = useCallback((date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { groupedIncoming, groupedOutgoing } = useMemo(() => {
    const now = Date.now();
    const processed: ProcessedProposal[] = pendingTransferProposals
      .map(proposal => {
        const isExpired = now > proposal.expires_at_micros / 1000;
        const expiresAt = new Date(proposal.expires_at_micros / 1000);
        const isIncoming = proposal.sender !== account.xpub;
        return {
          ...proposal,
          isExpired,
          isIncoming,
          amount: new BigNumber(proposal.amount),
          expiresAt,
          day: startOfDay(expiresAt),
        };
      })
      .reverse();

    // Separate into incoming and outgoing
    const incoming = processed.filter(p => p.isIncoming);
    const outgoing = processed.filter(p => !p.isIncoming);

    // Group by day helper function
    const groupByDay = (proposals: ProcessedProposal[]): GroupedProposals => {
      const grouped = new Map<string, ProcessedProposal[]>();
      proposals.forEach(proposal => {
        const dayKey = proposal.day.toISOString();
        if (!grouped.has(dayKey)) {
          grouped.set(dayKey, []);
        }
        grouped.get(dayKey)!.push(proposal);
      });

      return Array.from(grouped.entries())
        .map(([dayKey, proposals]) => ({
          day: new Date(dayKey),
          proposals,
        }))
        .sort((a, b) => b.day.getTime() - a.day.getTime());
    };

    return {
      groupedIncoming: groupByDay(incoming),
      groupedOutgoing: groupByDay(outgoing),
    };
  }, [pendingTransferProposals, startOfDay, account.xpub]);

  const handleModalConfirm = useCallback(
    async (contractId: string, action: "accept" | "reject" | "withdraw", deviceId: string) => {
      if (action === "accept") {
        await performTransferInstruction(
          { contractId, deviceId, reason: "" },
          "accept-transfer-instruction",
        );
      } else if (action === "reject") {
        await performTransferInstruction(
          { contractId, deviceId, reason: "" },
          "reject-transfer-instruction",
        );
      } else if (action === "withdraw") {
        await performTransferInstruction(
          { contractId, deviceId, reason: "" },
          "withdraw-transfer-instruction",
        );
      }
      // Request account sync after action completes
      sync({
        type: "SYNC_ONE_ACCOUNT",
        accountId: account.id,
        priority: 10,
        reason: "canton-pending-transaction-action",
      });
    },
    [performTransferInstruction, sync, account.id],
  );

  const handleOpenModal = useCallback(
    (contractId: string, action: "accept" | "reject" | "withdraw") => {
      setIsDetailsOpen(false);
      setModalAction(action);
      setModalContractId(contractId);
      setIsModalOpen(true);
    },
    [],
  );

  const handleRowClick = useCallback((contractId: string) => {
    setSelectedContractId(contractId);
    setIsDetailsOpen(true);
  }, []);

  const incomingCount = useMemo(
    () => groupedIncoming.reduce((sum, group) => sum + group.proposals.length, 0),
    [groupedIncoming],
  );

  const outgoingCount = useMemo(
    () => groupedOutgoing.reduce((sum, group) => sum + group.proposals.length, 0),
    [groupedOutgoing],
  );

  const ProposalRow: React.FC<{
    proposal: ProcessedProposal;
  }> = ({ proposal }) => {
    const isIncoming = proposal.isIncoming;
    const timeRemaining = useTimeRemaining(proposal.expires_at_micros, proposal.isExpired);
    const hoursAndMinutesOptions = useSelector(hoursAndMinutesOptionsSelector);

    return (
      <Touchable onPress={() => handleRowClick(proposal.contract_id)}>
        <Flex
          flexDirection="row"
          alignItems="center"
          py={2}
          borderBottomWidth={1}
          borderBottomColor="neutral.c30"
        >
          <Flex mr={3} alignItems="center" justifyContent="center">
            {proposal.isExpired ? (
              <IconClose size={16} color="error.c50" />
            ) : isIncoming ? (
              <IconReceive size={16} color="primary.c80" />
            ) : (
              <ArrowRight size={16} color="neutral.c80" />
            )}
          </Flex>

          <Flex flex={1} flexDirection="column">
            <Flex flexDirection="row" alignItems="center" mb={1}>
              <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
                {shortAddressPreview(isIncoming ? proposal.sender : proposal.receiver)}
              </Text>
            </Flex>
            <Flex flexDirection="row" alignItems="center">
              <Text variant="small" color="neutral.c70" mr={2}>
                {hoursAndMinutesOptions.format(proposal.expiresAt)}
              </Text>
              {!proposal.isExpired && timeRemaining && (
                <Text variant="small" color="neutral.c70">
                  • {timeRemaining}
                </Text>
              )}
              {proposal.isExpired && (
                <Text variant="small" color="error.c50">
                  • {t("canton.pendingTransactions.expired")}
                </Text>
              )}
            </Flex>
          </Flex>

          <Flex alignItems="flex-end" mr={3}>
            <Text
              variant="body"
              fontWeight="semiBold"
              color={isIncoming ? "success.c50" : "error.c50"}
            >
              <CurrencyUnitValue
                unit={unit}
                value={isIncoming ? proposal.amount : proposal.amount.negated()}
                showCode
                alwaysShowSign
              />
            </Text>
            <Text variant="small" color="neutral.c70" mt={0.5}>
              <CounterValue
                currency={account.currency}
                value={isIncoming ? proposal.amount : proposal.amount.negated()}
                showCode
                alwaysShowSign
              />
            </Text>
          </Flex>

          <Flex flexDirection="row" pr={4}>
            {isIncoming ? (
              <>
                <Button type="shade" onPress={() => handleRowClick(proposal.contract_id)} mr={2}>
                  <Trans i18nKey="canton.pendingTransactions.review" />
                </Button>
              </>
            ) : (
              <Button
                type="main"
                outline
                iconName="Close"
                onPress={() => handleOpenModal(proposal.contract_id, "withdraw")}
              />
            )}
          </Flex>
        </Flex>
      </Touchable>
    );
  };

  const renderSection = (proposals: GroupedProposals, count: number, titleKey: string) => {
    if (count === 0) return null;

    return (
      <SectionContainer key={titleKey}>
        <SectionTitle title={t(titleKey)} containerProps={{ mb: 4, px: 6 }} />
        {proposals.map(group => (
          <Flex key={group.day.toISOString()}>
            <Flex px={4}>
              <SectionHeader day={group.day} />
            </Flex>
            {group.proposals.map(proposal => (
              <ProposalRow key={proposal.contract_id} proposal={proposal} />
            ))}
          </Flex>
        ))}
      </SectionContainer>
    );
  };

  if (incomingCount === 0 && outgoingCount === 0) {
    return null;
  }

  return (
    <>
      <DeviceAppModal
        isOpen={isModalOpen}
        onConfirm={async deviceId => handleModalConfirm(modalContractId, modalAction, deviceId)}
        action={modalAction}
        onClose={() => setIsModalOpen(false)}
        appName={cantonAccount?.currency.managerAppName || account.currency.managerAppName}
      />
      <PendingTransferProposalsDetails
        isOpen={isDetailsOpen}
        account={account}
        contractId={selectedContractId}
        onOpenModal={handleOpenModal}
        onClose={() => setIsDetailsOpen(false)}
      />
      {renderSection(groupedIncoming, incomingCount, "canton.pendingTransactions.incoming.title")}
      {renderSection(groupedOutgoing, outgoingCount, "canton.pendingTransactions.outgoing.title")}
    </>
  );
};

export default PendingTransferProposals;

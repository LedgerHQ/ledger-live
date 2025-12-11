import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { isCantonAccount } from "@ledgerhq/coin-canton";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import TableContainer, {
  TableRow as BaseTableRow,
  TableHeader,
} from "~/renderer/components/TableContainer";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import FormattedVal from "~/renderer/components/FormattedVal";
import PendingTransferProposalsDetails from "./PendingTransferProposalsDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import SectionTitle from "~/renderer/components/OperationsList/SectionTitle";
import OperationDate from "~/renderer/components/OperationsList/OperationDate";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconCross from "~/renderer/icons/Cross";
import DeviceAppModal from "./DeviceAppModal";
import Tooltip from "~/renderer/components/Tooltip";
import {
  useCantonAcceptOrRejectOffer,
  useTimeRemaining,
  type TransferInstructionType,
} from "@ledgerhq/live-common/families/canton/react";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { handleTopologyChangeError, TopologyChangeError } from "../hooks/topologyChangeError";
import type { TransferProposalAction } from "./types";

type Props = {
  account: Account;
  parentAccount: Account;
};

type Modal = {
  isOpen: boolean;
  action: TransferProposalAction;
  contractId: string;
};

const INSTRUCTION_TYPE_MAP: Record<TransferProposalAction, TransferInstructionType> = {
  accept: "accept-transfer-instruction",
  reject: "reject-transfer-instruction",
  withdraw: "withdraw-transfer-instruction",
};

const initialValues = {
  groupedIncoming: [],
  groupedOutgoing: [],
  incomingCount: 0,
  outgoingCount: 0,
};

const PendingTransferProposals: React.FC<Props> = ({ account, parentAccount }) => {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const unit = useAccountUnit(account);
  const sync = useBridgeSync();
  const [modal, setModal] = useState<Modal>({ isOpen: false, action: "accept", contractId: "" });

  const cantonAccount = isCantonAccount(parentAccount) ? parentAccount : null;
  const accountXpub = parentAccount.xpub ?? "";

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: parentAccount.currency,
    account: parentAccount,
    partyId: accountXpub,
  });

  const { groupedIncoming, groupedOutgoing, incomingCount, outgoingCount } = useMemo(() => {
    if (!isCantonAccount(account)) return initialValues;

    const pendingTransferProposals = account.cantonResources?.pendingTransferProposals ?? [];

    const { incoming, outgoing } = processTransferProposals(pendingTransferProposals, accountXpub);

    return {
      groupedIncoming: groupByDay(incoming),
      groupedOutgoing: groupByDay(outgoing),
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
    };
  }, [account, accountXpub]);

  const handleOpenModal = useCallback((contractId: string, action: TransferProposalAction) => {
    setModal({ isOpen: true, action, contractId });
  }, []);

  const handleModalConfirm = useCallback(
    async (contractId: string, action: TransferProposalAction, deviceId: string) => {
      try {
        const instructionType = INSTRUCTION_TYPE_MAP[action];
        await performTransferInstruction({ contractId, deviceId, reason: "" }, instructionType);

        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: parentAccount.id,
          priority: 10,
          reason: "canton-pending-transaction-action",
        });
      } catch (error) {
        if (error instanceof TopologyChangeError) {
          // Topology changed - need to reonboard before continuing
          setModal(prev => ({ ...prev, isOpen: false }));
          handleTopologyChangeError(dispatch, {
            currency: parentAccount.currency,
            device,
            accounts: [],
            mainAccount: parentAccount,
            navigationSnapshot: {
              type: "transfer-proposal",
              handler: handleOpenModal,
              props: { action, contractId },
            },
          });
          return;
        }
        throw error;
      }
    },
    [performTransferInstruction, sync, parentAccount, dispatch, device, handleOpenModal],
  );

  const handleDeviceConfirm = useCallback(
    async (deviceId: string) => {
      await handleModalConfirm(modal.contractId, modal.action, deviceId);
    },
    [handleModalConfirm, modal.contractId, modal.action],
  );

  const handleRowClick = useCallback(
    (contractId: string) => {
      setDrawer(PendingTransferProposalsDetails, {
        account,
        contractId,
        onOpenModal: handleOpenModal,
      });
    },
    [account, handleOpenModal],
  );

  if (incomingCount === 0 && outgoingCount === 0) {
    return null;
  }

  return (
    <>
      <DeviceAppModal
        isOpen={modal.isOpen}
        onConfirm={handleDeviceConfirm}
        action={modal.action}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        appName={cantonAccount?.currency.managerAppName ?? parentAccount.currency.managerAppName}
      />
      <ProposalsTable
        proposals={groupedIncoming}
        count={incomingCount}
        titleKey="families.canton.pendingTransactions.incoming.title"
        isIncomingTable={true}
        unit={unit}
        onRowClick={handleRowClick}
        onOpenModal={handleOpenModal}
      />
      <ProposalsTable
        proposals={groupedOutgoing}
        count={outgoingCount}
        titleKey="families.canton.pendingTransactions.outgoing.title"
        isIncomingTable={false}
        unit={unit}
        onRowClick={handleRowClick}
        onOpenModal={handleOpenModal}
      />
    </>
  );
};

export default PendingTransferProposals;

type RawTransferProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: string;
  instrument_id: string;
  memo: string;
  expires_at_micros: number;
};

type ProcessedProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  instrument_id: string;
  memo: string;
  expires_at_micros: number;
  expiresAtMicros: number;
  isExpired: boolean;
  isIncoming: boolean;
  expiresAt: Date;
  day: Date;
};

type GroupedProposals = Array<{
  day: Date;
  proposals: ProcessedProposal[];
}>;

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const processTransferProposals = (
  proposals: RawTransferProposal[],
  accountXpub: string,
): { incoming: ProcessedProposal[]; outgoing: ProcessedProposal[] } => {
  const currentTime = Date.now();
  const incoming: ProcessedProposal[] = [];
  const outgoing: ProcessedProposal[] = [];

  for (let i = proposals.length - 1; i >= 0; i--) {
    const proposal = proposals[i];
    const expiresAtTimestamp = proposal.expires_at_micros / 1000;
    const expiresAt = new Date(expiresAtTimestamp);
    const isExpired = currentTime > expiresAtTimestamp;
    const isIncoming = proposal.sender !== accountXpub;

    const processed: ProcessedProposal = {
      contract_id: proposal.contract_id,
      sender: proposal.sender,
      receiver: proposal.receiver,
      amount: new BigNumber(proposal.amount),
      instrument_id: proposal.instrument_id,
      memo: proposal.memo,
      expires_at_micros: proposal.expires_at_micros,
      expiresAtMicros: proposal.expires_at_micros,
      isExpired,
      isIncoming,
      expiresAt,
      day: startOfDay(expiresAt),
    };

    if (isIncoming) {
      incoming.push(processed);
    } else {
      outgoing.push(processed);
    }
  }

  return { incoming, outgoing };
};

const groupByDay = (proposals: ProcessedProposal[]): GroupedProposals => {
  if (proposals.length === 0) {
    return [];
  }

  const grouped = new Map<number, ProcessedProposal[]>();

  for (const proposal of proposals) {
    const dayTimestamp = proposal.day.getTime();
    const existing = grouped.get(dayTimestamp);
    if (existing) {
      existing.push(proposal);
    } else {
      grouped.set(dayTimestamp, [proposal]);
    }
  }

  return Array.from(grouped.entries())
    .sort(([timestampA], [timestampB]) => timestampB - timestampA)
    .map(([dayTimestamp, proposals]) => ({
      day: new Date(dayTimestamp),
      proposals,
    }));
};

// Child components
const TableRow = styled(BaseTableRow)`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

const TableHeaderRow = styled(Box)`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
  background-color: ${p => p.theme.colors.background.main};
  padding: 12px 0;
`;

type CountdownProps = {
  expiresAt: Date;
};

const CountdownDisplay: React.FC<CountdownProps> = ({ expiresAt }) => {
  return (
    <Box horizontal={false}>
      <OperationDate date={expiresAt} />
    </Box>
  );
};

type ExpiresInDisplayProps = {
  expiresAtMicros: number;
  isExpired: boolean;
  t: (key: string) => string;
};

const ExpiresInDisplay: React.FC<ExpiresInDisplayProps> = ({ expiresAtMicros, isExpired, t }) => {
  const timeRemaining = useTimeRemaining(expiresAtMicros, isExpired);

  if (isExpired) {
    return (
      <Text fontSize={3} color="alertRed" ff="Inter">
        {t("families.canton.pendingTransactions.expired")}
      </Text>
    );
  }

  return (
    <Text fontSize={3} color="neutral.c80" ff="Inter">
      {timeRemaining || "-"}
    </Text>
  );
};

type ProposalRowProps = {
  proposal: ProcessedProposal;
  unit: ReturnType<typeof useAccountUnit>;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  t: (key: string) => string;
};

const ProposalRow: React.FC<ProposalRowProps> = ({
  proposal,
  unit,
  onRowClick,
  onOpenModal,
  t,
}) => {
  const {
    isIncoming,
    isExpired,
    contract_id,
    sender,
    receiver,
    amount,
    expiresAt,
    expiresAtMicros,
  } = proposal;

  const addressToShow = isIncoming ? sender : receiver;
  const amountValue = isIncoming ? amount : amount.negated();

  const handleAcceptClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isExpired) {
        onOpenModal(contract_id, "accept");
      }
    },
    [contract_id, isExpired, onOpenModal],
  );

  const handleRejectClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenModal(contract_id, "reject");
    },
    [contract_id, onOpenModal],
  );

  const handleWithdrawClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenModal(contract_id, "withdraw");
    },
    [contract_id, onOpenModal],
  );

  return (
    <TableRow key={contract_id} onClick={() => onRowClick(contract_id)}>
      <Box horizontal alignItems="center" flex={1} style={{ height: "28px" }}>
        {/* Date Cell */}
        <Box px={3} horizontal={true} alignItems="center" style={{ minWidth: "120px" }}>
          <Box mr={2} alignItems="center" justifyContent="center">
            {isExpired ? (
              <Tooltip content={t("families.canton.pendingTransactions.status.expired")}>
                <Box color="alertRed">
                  <IconCross size={16} />
                </Box>
              </Tooltip>
            ) : isIncoming ? (
              <Tooltip content={t("families.canton.pendingTransactions.status.incoming")}>
                <IconReceive size={16} />
              </Tooltip>
            ) : (
              <Tooltip content={t("families.canton.pendingTransactions.status.outgoing")}>
                <IconSend size={16} />
              </Tooltip>
            )}
          </Box>
          <Box horizontal={false}>
            <CountdownDisplay expiresAt={expiresAt} />
          </Box>
        </Box>

        <Box px={4} horizontal={true} alignItems="center" style={{ flex: 1 }}>
          <Text fontSize={3} color="neutral.c80" ff="Inter">
            {addressToShow}
          </Text>
        </Box>

        <Box
          px={4}
          horizontal={true}
          alignItems="center"
          style={{
            flex: "0 0 auto",
            minWidth: "120px",
            height: "32px",
          }}
        >
          <ExpiresInDisplay expiresAtMicros={expiresAtMicros} isExpired={isExpired} t={t} />
        </Box>

        <Box
          px={4}
          horizontal={false}
          alignItems="flex-end"
          style={{
            flex: "0 0 auto",
            textAlign: "right",
            justifyContent: "center",
            height: "32px",
            minWidth: "150px",
          }}
        >
          <FormattedVal
            val={amountValue}
            unit={unit}
            showCode
            fontSize={4}
            alwaysShowSign
            color={isIncoming ? undefined : "neutral.c80"}
          />
        </Box>

        <Box
          px={3}
          horizontal={true}
          alignItems="center"
          style={{
            flex: "0 0 auto",
            gap: "4px",
            minWidth: "150px",
          }}
        >
          {isIncoming ? (
            <>
              <Button
                small
                primary
                disabled={isExpired}
                onClick={handleAcceptClick}
                style={{ minWidth: "auto", padding: "4px 8px" }}
              >
                {t("families.canton.pendingTransactions.accept")}
              </Button>
              <Button
                small
                outline
                onClick={handleRejectClick}
                style={{ minWidth: "auto", padding: "4px 8px" }}
              >
                {t("families.canton.pendingTransactions.reject")}
              </Button>
            </>
          ) : (
            <Button
              small
              outline
              onClick={handleWithdrawClick}
              style={{ minWidth: "auto", padding: "4px 8px" }}
            >
              {t("families.canton.pendingTransactions.withdraw")}
            </Button>
          )}
        </Box>
      </Box>
    </TableRow>
  );
};

const ProposalRowMemo = memo(ProposalRow);

type ProposalsTableProps = {
  proposals: GroupedProposals;
  count: number;
  titleKey: string;
  isIncomingTable: boolean;
  unit: ReturnType<typeof useAccountUnit>;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

const ProposalsTable: React.FC<ProposalsTableProps> = ({
  proposals,
  count,
  titleKey,
  isIncomingTable,
  unit,
  onRowClick,
  onOpenModal,
}) => {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <TableContainer mb={7}>
      <TableHeader
        title={t(titleKey, { count })}
        titleProps={{
          "data-e2e": `canton_PendingTransactions_${isIncomingTable ? "incoming" : "outgoing"}`,
        }}
      />
      <TableHeaderRow>
        <Box horizontal alignItems="center" flex={1} style={{ height: "28px" }} px={4}>
          <Box px={3} horizontal={true} alignItems="center" style={{ minWidth: "120px" }}>
            <Box horizontal={false}>
              <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
                {t("families.canton.pendingTransactions.date")}
              </Text>
            </Box>
          </Box>
          <Box px={4} horizontal={true} alignItems="center" style={{ flex: 1 }}>
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {isIncomingTable
                ? t("families.canton.pendingTransactions.from")
                : t("families.canton.pendingTransactions.to")}
            </Text>
          </Box>
          <Box
            px={4}
            horizontal={false}
            style={{
              flex: "0 0 auto",
              minWidth: "120px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.expiresIn")}
            </Text>
          </Box>
          <Box
            px={4}
            horizontal={false}
            style={{
              flex: "0 0 auto",
              textAlign: "right",
              justifyContent: "center",
              minWidth: "150px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.amount")}
            </Text>
          </Box>
          <Box
            px={3}
            horizontal={true}
            alignItems="center"
            style={{
              flex: "0 0 auto",
              gap: "4px",
              minWidth: "150px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.action")}
            </Text>
          </Box>
        </Box>
      </TableHeaderRow>
      {proposals.map(group => (
        <Box key={group.day.getTime()}>
          <SectionTitle date={group.day} />
          <Box p={0}>
            {group.proposals.map(proposal => (
              <ProposalRowMemo
                key={proposal.contract_id}
                proposal={proposal}
                unit={unit}
                onRowClick={onRowClick}
                onOpenModal={onOpenModal}
                t={t}
              />
            ))}
          </Box>
        </Box>
      ))}
    </TableContainer>
  );
};

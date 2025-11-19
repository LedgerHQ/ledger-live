import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
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
import { useCantonAcceptOrRejectOffer } from "@ledgerhq/live-common/families/canton/react";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useTimeRemaining } from "./utils";

const TableRow = styled(BaseTableRow)`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
`;

const TableHeaderRow = styled(Box)`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: ${p => p.theme.colors.palette.background.paper};
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
  expiresAt: Date;
  isExpired: boolean;
  t: (key: string) => string;
};

const ExpiresInDisplay: React.FC<ExpiresInDisplayProps> = ({ expiresAt, isExpired, t }) => {
  const timeRemaining = useTimeRemaining(expiresAt.getTime(), isExpired);

  if (isExpired) {
    return (
      <Text fontSize={3} color="alertRed" ff="Inter">
        {t("families.canton.pendingTransactions.expired")}
      </Text>
    );
  }

  return (
    <Text fontSize={3} color="palette.text.shade80" ff="Inter">
      {timeRemaining || "-"}
    </Text>
  );
};

type Props = {
  account: Account;
};

type Action = "accept" | "reject" | "withdraw";

const PendingTransferProposals: React.FC<Props> = ({ account }) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const sync = useBridgeSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<Action>("accept");
  const [modalContractId, setModalContractId] = useState<string>("");

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: account.currency,
    account,
    partyId: account.xpub || "",
  });

  const cantonAccount = account as CantonAccount;
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
    const processed = pendingTransferProposals
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
    const groupByDay = (proposals: typeof processed) => {
      const grouped = new Map<string, typeof processed>();
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
      setIsModalOpen(true);
      setModalAction(action);
      setModalContractId(contractId);
    },
    [],
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

  const incomingCount = useMemo(
    () => groupedIncoming.reduce((sum, group) => sum + group.proposals.length, 0),
    [groupedIncoming],
  );

  const outgoingCount = useMemo(
    () => groupedOutgoing.reduce((sum, group) => sum + group.proposals.length, 0),
    [groupedOutgoing],
  );

  const renderTable = (
    proposals: typeof groupedIncoming,
    count: number,
    titleKey: string,
    isIncomingTable: boolean,
  ) => {
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
                <Text fontSize={3} color="palette.text.shade60" ff="Inter|SemiBold">
                  {t("families.canton.pendingTransactions.date")}
                </Text>
              </Box>
            </Box>
            <Box px={4} horizontal={true} alignItems="center" style={{ flex: 1 }}>
              <Text fontSize={3} color="palette.text.shade60" ff="Inter|SemiBold">
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
              <Text fontSize={3} color="palette.text.shade60" ff="Inter|SemiBold">
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
              <Text fontSize={3} color="palette.text.shade60" ff="Inter|SemiBold">
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
              <Text fontSize={3} color="palette.text.shade60" ff="Inter|SemiBold">
                {t("families.canton.pendingTransactions.action")}
              </Text>
            </Box>
          </Box>
        </TableHeaderRow>
        {proposals.map(group => (
          <Box key={group.day.toISOString()}>
            <SectionTitle date={group.day} />
            <Box p={0}>
              {group.proposals.map(proposal => {
                const isIncoming = proposal.isIncoming;
                return (
                  <TableRow
                    key={proposal.contract_id}
                    onClick={() => handleRowClick(proposal.contract_id)}
                  >
                    <Box horizontal alignItems="center" flex={1} style={{ height: "28px" }}>
                      {/* Date Cell - similar to DateCell */}
                      <Box
                        px={3}
                        horizontal={true}
                        alignItems="center"
                        style={{ minWidth: "120px" }}
                      >
                        <Box mr={2} alignItems="center" justifyContent="center">
                          {proposal.isExpired ? (
                            <Tooltip
                              content={t("families.canton.pendingTransactions.status.expired")}
                            >
                              <Box color="alertRed">
                                <IconCross size={16} />
                              </Box>
                            </Tooltip>
                          ) : isIncoming ? (
                            <Tooltip
                              content={t("families.canton.pendingTransactions.status.incoming")}
                            >
                              <IconReceive size={16} />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              content={t("families.canton.pendingTransactions.status.outgoing")}
                            >
                              <IconSend size={16} />
                            </Tooltip>
                          )}
                        </Box>
                        <Box horizontal={false}>
                          <CountdownDisplay expiresAt={proposal.expiresAt} />
                        </Box>
                      </Box>

                      <Box px={4} horizontal={true} alignItems="center" style={{ flex: 1 }}>
                        <Text fontSize={3} color="palette.text.shade80" ff="Inter">
                          {isIncoming ? proposal.sender : proposal.receiver}
                        </Text>
                      </Box>

                      <Box
                        px={4}
                        horizontal={false}
                        alignItems="center"
                        style={{
                          flex: "0 0 auto",
                          minWidth: "120px",
                          height: "32px",
                        }}
                      >
                        <ExpiresInDisplay
                          expiresAt={proposal.expiresAt}
                          isExpired={proposal.isExpired}
                          t={t}
                        />
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
                          val={isIncoming ? proposal.amount : proposal.amount.negated()}
                          unit={unit}
                          showCode
                          fontSize={4}
                          alwaysShowSign
                          color={isIncoming ? undefined : "palette.text.shade80"}
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
                              disabled={proposal.isExpired}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!proposal.isExpired) {
                                  handleOpenModal(proposal.contract_id, "accept");
                                }
                              }}
                              style={{ minWidth: "auto", padding: "4px 8px" }}
                            >
                              {t("families.canton.pendingTransactions.accept")}
                            </Button>
                            <Button
                              small
                              outline
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleOpenModal(proposal.contract_id, "reject");
                              }}
                              style={{ minWidth: "auto", padding: "4px 8px" }}
                            >
                              {t("families.canton.pendingTransactions.reject")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            small
                            outline
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleOpenModal(proposal.contract_id, "withdraw");
                            }}
                            style={{ minWidth: "auto", padding: "4px 8px" }}
                          >
                            {t("families.canton.pendingTransactions.withdraw")}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </TableRow>
                );
              })}
            </Box>
          </Box>
        ))}
      </TableContainer>
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
        appName={cantonAccount.currency.managerAppName}
      />
      {renderTable(
        groupedIncoming,
        incomingCount,
        "families.canton.pendingTransactions.incoming.title",
        true,
      )}
      {renderTable(
        groupedOutgoing,
        outgoingCount,
        "families.canton.pendingTransactions.outgoing.title",
        false,
      )}
    </>
  );
};

export default PendingTransferProposals;

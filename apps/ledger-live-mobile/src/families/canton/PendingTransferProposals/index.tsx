import { isCantonAccount } from "@ledgerhq/coin-canton";
import { TopologyChangeError } from "@ledgerhq/coin-canton/types/errors";
import { getAccountCurrency, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import {
  useCantonAcceptOrRejectOffer,
  useTimeRemaining,
  type TransferInstructionType,
} from "@ledgerhq/live-common/families/canton/react";
import { Button, Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { hoursAndMinutesOptionsSelector } from "~/components/DateFormat/FormatDate";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import SectionHeader from "~/components/SectionHeader";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import ArrowRight from "~/icons/ArrowRight";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import {
  createNavigationSnapshot,
  getNavigatorForScreen,
  type NavigationSnapshot,
  type ScreenRoute,
} from "../utils/navigationSnapshot";
import DeviceAppModal from "./DeviceAppModal";
import PendingTransferProposalsDetails from "./PendingTransferProposalsDetails";
import { type TransferProposalAction } from "./types";

type Props = {
  account: Account;
  parentAccount: Account;
};

type Modal = {
  isOpen: boolean;
  action: TransferProposalAction;
  contractId: string;
};

type RestoreModalState = {
  action: TransferProposalAction;
  contractId: string;
};

const initialValues = {
  groupedIncoming: [],
  groupedOutgoing: [],
  incomingCount: 0,
  outgoingCount: 0,
};

const INSTRUCTION_TYPE_MAP: Record<TransferProposalAction, TransferInstructionType> = {
  accept: "accept-transfer-instruction",
  reject: "reject-transfer-instruction",
  withdraw: "withdraw-transfer-instruction",
};

const PendingTransferProposals: React.FC<Props> = ({ account, parentAccount }) => {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute<ScreenRoute>();
  const unit = useAccountUnit(account);
  const sync = useBridgeSync();

  const [modal, setModal] = useState<Modal>({ isOpen: false, action: "accept", contractId: "" });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const restoreRef = useRef<{ action: TransferProposalAction; contractId: string } | null>(null);
  const accountXpub = parentAccount.xpub ?? "";

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: parentAccount.currency,
    account: parentAccount,
    partyId: accountXpub,
  });

  const cantonAccount = isCantonAccount(parentAccount) ? parentAccount : null;

  const redirectToReonboarding = useCallback(
    (action?: TransferProposalAction, contractId?: string) => {
      const restoreState: NavigationSnapshot =
        action && contractId
          ? {
              type: "transfer-proposal",
              action,
              contractId,
              navigator: getNavigatorForScreen(route.name),
              screen: route.name,
              params: route.params,
            }
          : createNavigationSnapshot(route);

      navigation.navigate(NavigatorName.CantonOnboard, {
        screen: ScreenName.CantonOnboardAccount,
        params: {
          accountsToAdd: [],
          currency: account.currency,
          isReonboarding: true,
          accountToReonboard: account,
          restoreState,
        },
      });
    },
    [account, navigation, route],
  );

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

  const handleModalConfirm = useCallback(
    async (contractId: string, action: TransferProposalAction, deviceId: string) => {
      try {
        const instructionType = INSTRUCTION_TYPE_MAP[action];
        await performTransferInstruction({ contractId, deviceId, reason: "" }, instructionType);

        // Sync account to reflect the changes
        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          priority: 10,
          reason: "canton-pending-transaction-action",
        });
      } catch (error) {
        if (error instanceof TopologyChangeError) {
          // Topology changed - need to reonboard before continuing
          setModal(prev => ({ ...prev, isOpen: false }));
          redirectToReonboarding(action, contractId);
          return;
        }
        throw error;
      }
    },
    [performTransferInstruction, sync, account, redirectToReonboarding],
  );

  const handleDeviceConfirm = useCallback(
    async (deviceId: string) => {
      await handleModalConfirm(modal.contractId, modal.action, deviceId);
    },
    [handleModalConfirm, modal.contractId, modal.action],
  );

  const handleOpenModal = useCallback((contractId: string, action: TransferProposalAction) => {
    setIsDetailsOpen(false);
    setModal({ isOpen: true, action, contractId });
  }, []);

  const handleRowClick = (contractId: string) => {
    setSelectedContractId(contractId);
    setIsDetailsOpen(true);
  };

  // Restore modal state after reonboarding completes
  useFocusEffect(
    useCallback(() => {
      const restoreModalState = route.params?.restoreModalState;
      if (!isValidRestoreModalState(restoreModalState)) {
        return;
      }

      const { action, contractId } = restoreModalState;
      navigation.setParams({ restoreModalState: undefined });
      restoreRef.current = { action, contractId };
    }, [route.params?.restoreModalState, navigation]),
  );

  useEffect(() => {
    if (restoreRef.current && !route.params?.restoreModalState) {
      const { action, contractId } = restoreRef.current;
      restoreRef.current = null;
      handleOpenModal(contractId, action);
    }
  }, [route.params?.restoreModalState, handleOpenModal]);

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
        appName={cantonAccount?.currency.managerAppName ?? account.currency.managerAppName}
      />
      <PendingTransferProposalsDetails
        isOpen={isDetailsOpen}
        account={account}
        parentAccount={parentAccount}
        contractId={selectedContractId}
        onOpenModal={handleOpenModal}
        onClose={() => setIsDetailsOpen(false)}
      />
      <ProposalsSection
        proposals={groupedIncoming}
        count={incomingCount}
        titleKey="canton.pendingTransactions.incoming.title"
        account={account}
        unit={unit}
        onRowClick={handleRowClick}
        onOpenModal={handleOpenModal}
      />
      <ProposalsSection
        proposals={groupedOutgoing}
        count={outgoingCount}
        titleKey="canton.pendingTransactions.outgoing.title"
        account={account}
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
  contractId: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  instrumentId: string;
  memo: string;
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
      contractId: proposal.contract_id,
      sender: proposal.sender,
      receiver: proposal.receiver,
      amount: new BigNumber(proposal.amount),
      instrumentId: proposal.instrument_id,
      memo: proposal.memo,
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

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
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

const isValidRestoreModalState = (value: unknown): value is RestoreModalState => {
  if (typeof value !== "object" || value === null) return false;
  return (
    "action" in value &&
    "contractId" in value &&
    typeof value.action === "string" &&
    typeof value.contractId === "string" &&
    value.action in INSTRUCTION_TYPE_MAP
  );
};

// Child components
type ProposalRowProps = {
  proposal: ProcessedProposal;
  account: Account;
  unit: ReturnType<typeof useAccountUnit>;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

const ProposalRow: React.FC<ProposalRowProps> = ({
  proposal,
  account,
  unit,
  onRowClick,
  onOpenModal,
}) => {
  const { t } = useTranslation();
  const { isIncoming, isExpired, contractId, sender, receiver, amount, expiresAt } = proposal;
  const timeRemaining = useTimeRemaining(proposal.expiresAtMicros, isExpired);
  const hoursAndMinutesOptions = useSelector(hoursAndMinutesOptionsSelector);

  const handleRowPress = useCallback(() => {
    onRowClick(contractId);
  }, [onRowClick, contractId]);

  const handleWithdrawPress = useCallback(() => {
    onOpenModal(contractId, "withdraw");
  }, [onOpenModal, contractId]);

  const addressToShow = isIncoming ? sender : receiver;
  const amountValue = isIncoming ? amount : amount.negated();
  const amountColor = isIncoming ? "success.c50" : "error.c50";
  const formattedTime = hoursAndMinutesOptions.format(expiresAt);

  const getIcon = () => {
    if (isExpired) {
      return <IconsLegacy.CloseMedium size={16} color="error.c50" />;
    }
    if (isIncoming) {
      return <IconsLegacy.ArrowBottomMedium size={16} color="primary.c80" />;
    }
    return <ArrowRight size={16} color="neutral.c80" />;
  };
  const icon = getIcon();

  return (
    <Touchable onPress={handleRowPress} testID={`proposal-row-${contractId}`}>
      <Flex
        flexDirection="row"
        alignItems="center"
        py={2}
        borderBottomWidth={1}
        borderBottomColor="neutral.c30"
      >
        <Flex mr={3} alignItems="center" justifyContent="center">
          {icon}
        </Flex>

        <Flex flex={1} flexDirection="column">
          <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1} mb={1}>
            {shortAddressPreview(addressToShow)}
          </Text>
          <Flex flexDirection="row" alignItems="center">
            <Text variant="small" color="neutral.c70" mr={2}>
              {formattedTime}
            </Text>
            {!isExpired && timeRemaining && (
              <Text variant="small" color="neutral.c70">
                • {timeRemaining}
              </Text>
            )}
            {isExpired && (
              <Text variant="small" color="error.c50">
                • {t("canton.pendingTransactions.expired")}
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex alignItems="flex-end" mr={3}>
          <Text variant="body" fontWeight="semiBold" color={amountColor}>
            <CurrencyUnitValue unit={unit} value={amountValue} showCode alwaysShowSign />
          </Text>
          <Text variant="small" color="neutral.c70" mt={0.5}>
            <CounterValue
              currency={getAccountCurrency(account)}
              value={amountValue}
              showCode
              alwaysShowSign
            />
          </Text>
        </Flex>

        <Flex flexDirection="row" pr={4}>
          {isIncoming ? (
            <Button type="shade" onPress={handleRowPress} mr={2}>
              <Trans i18nKey="canton.pendingTransactions.review" />
            </Button>
          ) : (
            <Button
              type="main"
              outline
              iconName="Close"
              onPress={handleWithdrawPress}
              testID={`withdraw-button-${contractId}`}
            />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
};

const ProposalRowMemo = memo(ProposalRow);

type ProposalsSectionProps = {
  proposals: GroupedProposals;
  count: number;
  titleKey: string;
  account: Account;
  unit: ReturnType<typeof useAccountUnit>;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

const ProposalsSection: React.FC<ProposalsSectionProps> = ({
  proposals,
  count,
  titleKey,
  account,
  unit,
  onRowClick,
  onOpenModal,
}) => {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <SectionContainer>
      <SectionTitle title={t(titleKey)} containerProps={{ mb: 4, px: 6 }} />
      {proposals.map(group => (
        <Flex key={group.day.getTime()}>
          <Flex px={4}>
            <SectionHeader day={group.day} />
          </Flex>
          {group.proposals.map(proposal => (
            <ProposalRowMemo
              key={proposal.contractId}
              proposal={proposal}
              account={account}
              unit={unit}
              onRowClick={onRowClick}
              onOpenModal={onOpenModal}
            />
          ))}
        </Flex>
      ))}
    </SectionContainer>
  );
};

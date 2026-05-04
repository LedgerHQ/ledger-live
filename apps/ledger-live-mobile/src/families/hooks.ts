/**
 * One hook per LLM family slot, created via createFamilySlotHook.
 * Each hook takes a family name and returns the slot module (or undefined if the
 * family doesn't implement that slot), loading it on first use via dynamic import().
 *
 * Usage: const specific = useOperationDetails(currency.family);
 */
import { createFamilySlotHook } from "./useFamilySlot";
import {
  accountActionsLoaders,
  AccountBalanceSummaryFooterLoaders,
  AccountBodyHeaderLoaders,
  AccountHeaderLoaders,
  AccountSubHeaderLoaders,
  ConfirmationLoaders,
  ConnectDeviceLoaders,
  EditOperationPanelLoaders,
  ExpiryDurationInputLoaders,
  MemoTagInputLoaders,
  MemoTagSummaryLoaders,
  NoAssociatedAccountsLoaders,
  operationDetailsLoaders,
  PendingTransferProposalsLoaders,
  ReceiveConfirmationPostAlertLoaders,
  ReceiveConfirmationTokenAlertLoaders,
  SendRowsCustomLoaders,
  SendRowsFeeLoaders,
  SendSelectRecipientLoaders,
  SubAccountListLoaders,
  TransactionConfirmFieldsLoaders,
} from "./loaders";

export const useAccountActions = createFamilySlotHook(accountActionsLoaders);
export const useAccountBalanceSummaryFooter = createFamilySlotHook(
  AccountBalanceSummaryFooterLoaders,
);
export const useAccountBodyHeader = createFamilySlotHook(AccountBodyHeaderLoaders);
export const useAccountHeader = createFamilySlotHook(AccountHeaderLoaders);
export const useAccountSubHeader = createFamilySlotHook(AccountSubHeaderLoaders);
export const useConfirmation = createFamilySlotHook(ConfirmationLoaders);
export const useConnectDevice = createFamilySlotHook(ConnectDeviceLoaders);
export const useEditOperationPanel = createFamilySlotHook(EditOperationPanelLoaders);
export const useExpiryDurationInput = createFamilySlotHook(ExpiryDurationInputLoaders);
export const useMemoTagInput = createFamilySlotHook(MemoTagInputLoaders);
export const useMemoTagSummary = createFamilySlotHook(MemoTagSummaryLoaders);
export const useNoAssociatedAccounts = createFamilySlotHook(NoAssociatedAccountsLoaders);
export const useOperationDetails = createFamilySlotHook(operationDetailsLoaders);
export const usePendingTransferProposals = createFamilySlotHook(PendingTransferProposalsLoaders);
export const useReceiveConfirmationPostAlert = createFamilySlotHook(
  ReceiveConfirmationPostAlertLoaders,
);
export const useReceiveConfirmationTokenAlert = createFamilySlotHook(
  ReceiveConfirmationTokenAlertLoaders,
);
export const useSendRowsCustom = createFamilySlotHook(SendRowsCustomLoaders);
export const useSendRowsFee = createFamilySlotHook(SendRowsFeeLoaders);
export const useSendSelectRecipient = createFamilySlotHook(SendSelectRecipientLoaders);
export const useSubAccountList = createFamilySlotHook(SubAccountListLoaders);
export const useTransactionConfirmFields = createFamilySlotHook(TransactionConfirmFieldsLoaders);

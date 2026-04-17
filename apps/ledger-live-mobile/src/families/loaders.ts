/**
 * Hand-maintained registry of dynamic import loaders for each LLM family slot.
 * One Map per slot — each Map key is the family name, value is the import factory.
 *
 * Add/remove entries here when a family adds or removes support for a slot.
 * The Map itself is the authoritative list of which families implement each slot.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader = () => Promise<{ default: any }>;

export const accountActionsLoaders = new Map<string, Loader>([
  ["bitcoin", () => import("../families/bitcoin/accountActions")],
  ["cardano", () => import("../families/cardano/accountActions")],
  ["celo", () => import("../families/celo/accountActions")],
  ["cosmos", () => import("../families/cosmos/accountActions")],
  ["evm", () => import("../families/evm/accountActions")],
  ["hedera", () => import("../families/hedera/accountActions")],
  ["multiversx", () => import("../families/multiversx/accountActions")],
  ["near", () => import("../families/near/accountActions")],
  ["polkadot", () => import("../families/polkadot/accountActions")],
  ["solana", () => import("../families/solana/accountActions")],
  ["sui", () => import("../families/sui/accountActions")],
  ["tezos", () => import("../families/tezos/accountActions")],
  ["tron", () => import("../families/tron/accountActions")],
]);

export const AccountBalanceSummaryFooterLoaders = new Map<string, Loader>([
  ["canton", () => import("../families/canton/AccountBalanceSummaryFooter")],
  ["celo", () => import("../families/celo/AccountBalanceSummaryFooter")],
  ["cosmos", () => import("../families/cosmos/AccountBalanceSummaryFooter")],
  ["hedera", () => import("../families/hedera/AccountBalanceSummaryFooter")],
  ["multiversx", () => import("../families/multiversx/AccountBalanceSummaryFooter")],
  ["near", () => import("../families/near/AccountBalanceSummaryFooter")],
  ["polkadot", () => import("../families/polkadot/AccountBalanceSummaryFooter")],
  ["sui", () => import("../families/sui/AccountBalanceSummaryFooter")],
  ["tron", () => import("../families/tron/AccountBalanceSummaryFooter")],
]);

export const AccountBodyHeaderLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/AccountBodyHeader")],
  ["cardano", () => import("../families/cardano/AccountBodyHeader")],
  ["celo", () => import("../families/celo/AccountBodyHeader")],
  ["cosmos", () => import("../families/cosmos/AccountBodyHeader")],
  ["hedera", () => import("../families/hedera/AccountBodyHeader")],
  ["multiversx", () => import("../families/multiversx/AccountBodyHeader")],
  ["near", () => import("../families/near/AccountBodyHeader")],
  ["polkadot", () => import("../families/polkadot/AccountBodyHeader")],
  ["solana", () => import("../families/solana/AccountBodyHeader")],
  ["sui", () => import("../families/sui/AccountBodyHeader")],
  ["tezos", () => import("../families/tezos/AccountBodyHeader")],
  ["tron", () => import("../families/tron/AccountBodyHeader")],
]);

export const AccountHeaderLoaders = new Map<string, Loader>([
  ["tezos", () => import("../families/tezos/AccountHeader")],
]);

export const AccountSubHeaderLoaders = new Map<string, Loader>([
  ["cardano", () => import("../families/cardano/AccountSubHeader")],
  ["casper", () => import("../families/casper/AccountSubHeader")],
  ["celo", () => import("../families/celo/AccountSubHeader")],
  ["filecoin", () => import("../families/filecoin/AccountSubHeader")],
  ["hedera", () => import("../families/hedera/AccountSubHeader")],
  ["icon", () => import("../families/icon/AccountSubHeader")],
  ["internet_computer", () => import("../families/internet_computer/AccountSubHeader")],
  ["mina", () => import("../families/mina/AccountSubHeader")],
  ["multiversx", () => import("../families/multiversx/AccountSubHeader")],
  ["near", () => import("../families/near/AccountSubHeader")],
  ["solana", () => import("../families/solana/AccountSubHeader")],
  ["stacks", () => import("../families/stacks/AccountSubHeader")],
  ["stellar", () => import("../families/stellar/AccountSubHeader")],
  ["sui", () => import("../families/sui/AccountSubHeader")],
  ["ton", () => import("../families/ton/AccountSubHeader")],
]);

export const ConfirmationLoaders = new Map<string, Loader>([
  ["concordium", () => import("../families/concordium/Confirmation")],
  ["hedera", () => import("../families/hedera/Confirmation")],
]);

export const ConnectDeviceLoaders = new Map<string, Loader>([
  ["concordium", () => import("../families/concordium/ConnectDevice")],
  ["hedera", () => import("../families/hedera/ConnectDevice")],
]);

export const EditOperationPanelLoaders = new Map<string, Loader>([
  ["bitcoin", () => import("../families/bitcoin/EditOperationPanel")],
  ["evm", () => import("../families/evm/EditOperationPanel")],
]);

export const ExpiryDurationInputLoaders = new Map<string, Loader>([
  ["canton", () => import("../families/canton/ExpiryDurationInput")],
]);

export const MemoTagInputLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/MemoTagInput")],
  ["canton", () => import("../families/canton/MemoTagInput")],
  ["cardano", () => import("../families/cardano/MemoTagInput")],
  ["casper", () => import("../families/casper/MemoTagInput")],
  ["concordium", () => import("../families/concordium/MemoTagInput")],
  ["cosmos", () => import("../families/cosmos/MemoTagInput")],
  ["hedera", () => import("../families/hedera/MemoTagInput")],
  ["internet_computer", () => import("../families/internet_computer/MemoTagInput")],
  ["solana", () => import("../families/solana/MemoTagInput")],
  ["stacks", () => import("../families/stacks/MemoTagInput")],
  ["stellar", () => import("../families/stellar/MemoTagInput")],
  ["ton", () => import("../families/ton/MemoTagInput")],
  ["xrp", () => import("../families/xrp/MemoTagInput")],
]);

/** Set of family names that have a MemoTagInput slot — for synchronous has-check. */
export const memoTagInputFamilies = new Set(MemoTagInputLoaders.keys());

export const MemoTagSummaryLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/MemoTagSummary")],
]);

export const NoAssociatedAccountsLoaders = new Map<string, Loader>([
  ["hedera", () => import("../families/hedera/NoAssociatedAccounts")],
]);

/** Set of family names that have a NoAssociatedAccounts slot — for synchronous has-check. */
export const noAssociatedAccountsFamilies = new Set(NoAssociatedAccountsLoaders.keys());

export const operationDetailsLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/operationDetails")],
  ["casper", () => import("../families/casper/operationDetails")],
  ["celo", () => import("../families/celo/operationDetails")],
  ["cosmos", () => import("../families/cosmos/operationDetails")],
  ["evm", () => import("../families/evm/operationDetails")],
  ["hedera", () => import("../families/hedera/operationDetails")],
  ["internet_computer", () => import("../families/internet_computer/operationDetails")],
  ["mina", () => import("../families/mina/operationDetails")],
  ["multiversx", () => import("../families/multiversx/operationDetails")],
  ["near", () => import("../families/near/operationDetails")],
  ["polkadot", () => import("../families/polkadot/operationDetails")],
  ["solana", () => import("../families/solana/operationDetails")],
  ["stacks", () => import("../families/stacks/operationDetails")],
  ["stellar", () => import("../families/stellar/operationDetails")],
  ["sui", () => import("../families/sui/operationDetails")],
  ["tezos", () => import("../families/tezos/operationDetails")],
  ["ton", () => import("../families/ton/operationDetails")],
  ["tron", () => import("../families/tron/operationDetails")],
  ["xrp", () => import("../families/xrp/operationDetails")],
]);

export const PendingTransferProposalsLoaders = new Map<string, Loader>([
  ["canton", () => import("../families/canton/PendingTransferProposals")],
]);

export const ReceiveConfirmationPostAlertLoaders = new Map<string, Loader>([
  ["bitcoin", () => import("../families/bitcoin/ReceiveConfirmationPostAlert")],
  ["tron", () => import("../families/tron/ReceiveConfirmationPostAlert")],
]);

export const ReceiveConfirmationTokenAlertLoaders = new Map<string, Loader>([
  ["hedera", () => import("../families/hedera/ReceiveConfirmationTokenAlert")],
]);

export const SendRowsCustomLoaders = new Map<string, Loader>([
  ["canton", () => import("../families/canton/SendRowsCustom")],
  ["cardano", () => import("../families/cardano/SendRowsCustom")],
  ["casper", () => import("../families/casper/SendRowsCustom")],
  ["cosmos", () => import("../families/cosmos/SendRowsCustom")],
  ["hedera", () => import("../families/hedera/SendRowsCustom")],
  ["internet_computer", () => import("../families/internet_computer/SendRowsCustom")],
  ["mina", () => import("../families/mina/SendRowsCustom")],
  ["solana", () => import("../families/solana/SendRowsCustom")],
  ["stacks", () => import("../families/stacks/SendRowsCustom")],
  ["stellar", () => import("../families/stellar/SendRowsCustom")],
  ["ton", () => import("../families/ton/SendRowsCustom")],
  ["xrp", () => import("../families/xrp/SendRowsCustom")],
]);

export const SendRowsFeeLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/SendRowsFee")],
  ["bitcoin", () => import("../families/bitcoin/SendRowsFee")],
  ["celo", () => import("../families/celo/SendRowsFee")],
  ["cosmos", () => import("../families/cosmos/SendRowsFee")],
  ["evm", () => import("../families/evm/SendRowsFee")],
  ["kaspa", () => import("../families/kaspa/SendRowsFee")],
  ["polkadot", () => import("../families/polkadot/SendRowsFee")],
  ["solana", () => import("../families/solana/SendRowsFee")],
  ["stellar", () => import("../families/stellar/SendRowsFee")],
  ["tezos", () => import("../families/tezos/SendRowsFee")],
  ["vechain", () => import("../families/vechain/SendRowsFee")],
  ["xrp", () => import("../families/xrp/SendRowsFee")],
]);

export const SendSelectRecipientLoaders = new Map<string, Loader>([
  ["canton", () => import("../families/canton/SendSelectRecipient")],
  ["hedera", () => import("../families/hedera/SendSelectRecipient")],
]);

export const SubAccountListLoaders = new Map<string, Loader>([
  ["algorand", () => import("../families/algorand/SubAccountList")],
  ["stellar", () => import("../families/stellar/SubAccountList")],
]);

export const TransactionConfirmFieldsLoaders = new Map<string, Loader>([
  ["casper", () => import("../families/casper/TransactionConfirmFields")],
  ["cosmos", () => import("../families/cosmos/TransactionConfirmFields")],
  ["filecoin", () => import("../families/filecoin/TransactionConfirmFields")],
  ["polkadot", () => import("../families/polkadot/TransactionConfirmFields")],
  ["solana", () => import("../families/solana/TransactionConfirmFields")],
  ["stacks", () => import("../families/stacks/TransactionConfirmFields")],
  ["stellar", () => import("../families/stellar/TransactionConfirmFields")],
  ["tezos", () => import("../families/tezos/TransactionConfirmFields")],
  ["tron", () => import("../families/tron/TransactionConfirmFields")],
]);

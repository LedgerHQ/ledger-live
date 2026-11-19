import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

/** The `stakePosition` translations the views render, shaped like the desktop English catalog. */
export const STAKE_POSITION_COPY = {
  details: {
    title: "Earning {{currencyName}}",
    totalRewards: "Total rewards",
    currentBalance: "Current balance",
    sectionTitle: "Details",
    initialDeposit: "Initial deposit",
    apy: "Current APY",
    apyBadge: "{{apy}} APY",
    status: "Transaction status",
    account: "Address",
    validator: "Validator",
  },
  status: {
    active: "Active",
    activating: "Activating",
    deactivating: "Deactivating",
    inactive: "Deactivated",
  },
  actions: {
    earnMore: "Earn more",
    deactivate: "Deactivate",
    withdraw: "Withdraw",
  },
  notice: {
    deactivating: "Deactivation in progress. You can withdraw your {{ticker}} once it is complete.",
    missingAuthority:
      "You can't change this position from this account. Another wallet may control it, or a lockup may apply.",
    updating: "This position is updating. Some details may be out of date.",
  },
  confirm: {
    deactivate: {
      title: "Deactivate your {{ticker}}",
      description:
        "Your {{amount}} in {{validator}} will be deactivated. Once deactivated, you will be able to withdraw your funds. It may take a few days to complete deactivation.",
      cta: "Deactivate",
    },
    withdraw: {
      title: "Withdraw {{ticker}}",
      description:
        "Your {{amount}} in {{validator}} will be withdrawn to your {{account}} account. This may take a few minutes.",
      cta: "Withdraw all",
    },
  },
  result: {
    successTitle: "Transaction signed",
    deactivateDescription:
      "Deactivation can take a few days. You can withdraw your {{ticker}} once it is complete.",
    withdrawDescription: "You'll receive your {{ticker}} soon.",
    viewTransaction: "View transaction",
    failureTitle: "Transaction failed",
    broadcastError:
      "Your transaction may have failed. Please wait a moment then check the transaction history before trying again.",
    retry: "Try again",
  },
  unavailable: {
    loading: "Loading your position...",
    notFoundTitle: "Position not available",
    notFoundDescription:
      "We can't show this position yet. Recent changes can take a few minutes to appear.",
    errorTitle: "We couldn't load this position",
    errorDescription: "Check your connection and try again.",
    retry: "Try again",
    close: "Close",
  },
} as const;

const RESOURCES = { en: { translation: { stakePosition: STAKE_POSITION_COPY } } };

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={RESOURCES}>{children}</I18nTestProvider>;
}

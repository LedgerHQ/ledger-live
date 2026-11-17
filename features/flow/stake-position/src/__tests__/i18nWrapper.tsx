import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

/** The `stakePosition` translations the views render, shaped like the apps' English catalogs. */
export const STAKE_POSITION_COPY = {
  details: {
    title: "{{ticker}} position",
    balance: "Balance",
    rewards: "Rewards",
    status: "Status",
    apy: "APY",
    validator: "Validator",
    address: "Stake account",
    unavailableValue: "—",
  },
  status: {
    active: "Active",
    activating: "Activating",
    deactivating: "Deactivating",
    inactive: "Deactivated",
  },
  actions: {
    earnMore: "Earn more",
    deactivate: "Deactivate to withdraw",
    withdraw: "Withdraw all",
  },
  notice: {
    deactivating: "Deactivation in progress. You can withdraw your {{ticker}} once it is complete.",
    missingAuthority:
      "You can't change this position from this account. Another wallet may control it, or a lockup may apply.",
  },
  confirm: {
    deactivate: {
      title: "Deactivate this position?",
      description:
        "Your {{ticker}} will stop earning rewards. Once deactivation is complete, you can withdraw it.",
      cta: "Deactivate",
    },
    withdraw: {
      title: "Withdraw all your {{ticker}}?",
      description: "The full balance of this position goes back to your {{ticker}} account.",
      cta: "Withdraw all",
    },
    amount: "Amount",
    validator: "Validator",
    fees: "Network fees",
  },
  unavailable: {
    loading: "Loading your position...",
    notFoundTitle: "Position not found",
    notFoundDescription:
      "We couldn't find this position in your account. Recent changes can take some time to appear.",
    close: "Close",
  },
} as const;

const RESOURCES = { en: { translation: { stakePosition: STAKE_POSITION_COPY } } };

export function I18nWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={RESOURCES}>{children}</I18nTestProvider>;
}

import React from "react";
import { TrophyCategory } from "../types";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";

// Trophy categories and data
export const TROPHY_CATEGORIES: TrophyCategory[] = [
  {
    id: "trading",
    title: "Trading & Transactions",
    icon: <IconsLegacy.ArrowUpMedium size={16} />,
    trophies: [
      {
        id: "first_transaction",
        title: "First Steps",
        description: "Complete your first transaction",
        rarity: "common" as const,
        icon: <IconsLegacy.ArrowUpMedium size={24} />,
        condition: (accounts: Account[]) => accounts.some(acc => acc.operations.length > 0),
        target: 1,
        progress: (accounts: Account[]) =>
          accounts.some(acc => acc.operations.length > 0) ? 1 : 0,
      },
      {
        id: "transaction_veteran",
        title: "Transaction Veteran",
        description: "Complete 100 transactions",
        rarity: "rare" as const,
        icon: <IconsLegacy.ArrowUpMedium size={24} />,
        condition: (accounts: Account[]) =>
          accounts.reduce((sum, acc) => sum + acc.operations.length, 0) >= 100,
        target: 100,
        progress: (accounts: Account[]) =>
          accounts.reduce((sum, acc) => sum + acc.operations.length, 0),
      },
      {
        id: "transaction_master",
        title: "Transaction Master",
        description: "Complete 1,000 transactions",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: (accounts: Account[]) =>
          accounts.reduce((sum, acc) => sum + acc.operations.length, 0) >= 1000,
        target: 1000,
        progress: (accounts: Account[]) =>
          accounts.reduce((sum, acc) => sum + acc.operations.length, 0),
      },
      {
        id: "high_value_transaction",
        title: "High Roller",
        description: "Send a transaction worth over $10,000",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
      {
        id: "fast_trader",
        title: "Speed Demon",
        description: "Complete 10 transactions in one day",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.ActivityMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "big_spender",
        title: "Big Spender",
        description: "Send transactions worth over $50,000 in total",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio Management",
    icon: <IconsLegacy.WalletMedium size={16} />,
    trophies: [
      {
        id: "diversified_portfolio",
        title: "Diversified Investor",
        description: "Hold 5 different cryptocurrencies",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.WalletMedium size={24} />,
        condition: (accounts: Account[]) => {
          const currencies = new Set(accounts.map(acc => acc.currency.id));
          return currencies.size >= 5;
        },
      },
      {
        id: "portfolio_milestone",
        title: "Portfolio Milestone",
        description: "Reach $1,000 in total portfolio value",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "hodler",
        title: "Diamond Hands",
        description: "Hold an asset for over 1 year",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
      {
        id: "crypto_whale",
        title: "Crypto Whale",
        description: "Hold over $100,000 in cryptocurrency",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
      {
        id: "balanced_investor",
        title: "Balanced Investor",
        description: "Maintain a balanced portfolio across asset classes",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.GraphGrowMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "crypto_whale",
        title: "Crypto Whale",
        description: "Hold over $100,000 in cryptocurrency",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
      {
        id: "balanced_investor",
        title: "Balanced Investor",
        description: "Maintain a balanced portfolio across asset classes",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.GraphGrowMedium size={24} />,
        condition: () => true, // Mock condition
      },
    ],
  },
  {
    id: "defi",
    title: "DeFi & Staking",
    icon: <IconsLegacy.LendMedium size={16} />,
    trophies: [
      {
        id: "first_stake",
        title: "Staking Pioneer",
        description: "Make your first staking transaction",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.LendMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "defi_explorer",
        title: "DeFi Explorer",
        description: "Use 3 different DeFi protocols",
        rarity: "rare" as const,
        icon: <IconsLegacy.GraphGrowMedium size={24} />,
        condition: () => false, // Mock condition
      },
      {
        id: "yield_farmer",
        title: "Yield Farmer",
        description: "Earn over $100 in staking rewards",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
    ],
  },
  {
    id: "engagement",
    title: "Platform Engagement",
    icon: <IconsLegacy.LedgerBlueMedium size={16} />,
    trophies: [
      {
        id: "daily_user",
        title: "Daily User",
        description: "Use Ledger Live for 7 consecutive days",
        rarity: "common" as const,
        icon: <IconsLegacy.CalendarMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "feature_explorer",
        title: "Feature Explorer",
        description: "Try 5 different Ledger Live features",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.LedgerBlueMedium size={24} />,
        condition: () => true, // Mock condition
      },
      {
        id: "power_user",
        title: "Power User",
        description: "Complete 50 different actions in Ledger Live",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
      },
    ],
  },
];

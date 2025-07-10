import React from "react";
import { TrophyCategory } from "../types";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";

// Helper function to generate NFT data
const generateNFTData = (trophyId: string, name: string) => ({
  name,
  link: `https://opensea.io/assets/ethereum/ledger-trophies/${trophyId}`,
  description: `This NFT represents your achievement in the Ledger ecosystem and grants you exclusive benefits.`,
});

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
        benefits: ["5% discount on Ledger Shop", "Welcome NFT badge"],
        nft: generateNFTData("first_transaction", "First Steps NFT"),
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
        benefits: ["15% discount on Ledger Shop", "Free shipping", "Priority support"],
        nft: generateNFTData("transaction_veteran", "Transaction Veteran NFT"),
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
        benefits: [
          "25% discount on Ledger Shop",
          "$50 BTC reward",
          "VIP support",
          "Exclusive merchandise",
        ],
        nft: generateNFTData("transaction_master", "Transaction Master NFT"),
      },
      {
        id: "high_value_transaction",
        title: "High Roller",
        description: "Send a transaction worth over $10,000",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: ["20% discount on Ledger Shop", "$25 ETH reward", "Premium support"],
        nft: generateNFTData("high_value_transaction", "High Roller NFT"),
      },
      {
        id: "fast_trader",
        title: "Speed Demon",
        description: "Complete 10 transactions in one day",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.ActivityMedium size={24} />,
        condition: () => true, // Mock condition
        benefits: ["10% discount on Ledger Shop", "Speed trading badge"],
        nft: generateNFTData("fast_trader", "Speed Demon NFT"),
      },
      {
        id: "big_spender",
        title: "Big Spender",
        description: "Send transactions worth over $50,000 in total",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: ["18% discount on Ledger Shop", "$30 SOL reward", "Free shipping"],
        nft: generateNFTData("big_spender", "Big Spender NFT"),
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
        benefits: ["12% discount on Ledger Shop", "Portfolio insights", "Market analysis"],
        nft: generateNFTData("diversified_portfolio", "Diversified Investor NFT"),
      },
      {
        id: "portfolio_milestone",
        title: "Portfolio Milestone",
        description: "Reach $1,000 in total portfolio value",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => true, // Mock condition
        benefits: ["15% discount on Ledger Shop", "$20 USDC reward", "Premium analytics"],
        nft: generateNFTData("portfolio_milestone", "Portfolio Milestone NFT"),
      },
      {
        id: "hodler",
        title: "Diamond Hands",
        description: "Hold an asset for over 1 year",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: [
          "30% discount on Ledger Shop",
          "$100 BTC reward",
          "Exclusive hodler merchandise",
          "Diamond hands badge",
        ],
        nft: generateNFTData("hodler", "Diamond Hands NFT"),
      },
      {
        id: "crypto_whale",
        title: "Crypto Whale",
        description: "Hold over $100,000 in cryptocurrency",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: [
          "35% discount on Ledger Shop",
          "$500 ETH reward",
          "VIP whale support",
          "Exclusive whale events",
        ],
        nft: generateNFTData("crypto_whale", "Crypto Whale NFT"),
      },
      {
        id: "balanced_investor",
        title: "Balanced Investor",
        description: "Maintain a balanced portfolio across asset classes",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.GraphGrowMedium size={24} />,
        condition: () => true, // Mock condition
        benefits: ["10% discount on Ledger Shop", "Balanced portfolio guide"],
        nft: generateNFTData("balanced_investor", "Balanced Investor NFT"),
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
        benefits: [
          "12% discount on Ledger Shop",
          "Staking guide",
          "Early access to new staking features",
        ],
        nft: generateNFTData("first_stake", "Staking Pioneer NFT"),
      },
      {
        id: "defi_explorer",
        title: "DeFi Explorer",
        description: "Use 3 different DeFi protocols",
        rarity: "rare" as const,
        icon: <IconsLegacy.GraphGrowMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: ["16% discount on Ledger Shop", "$25 DeFi tokens", "DeFi protocol access"],
        nft: generateNFTData("defi_explorer", "DeFi Explorer NFT"),
      },
      {
        id: "yield_farmer",
        title: "Yield Farmer",
        description: "Earn over $100 in staking rewards",
        rarity: "legendary" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: [
          "22% discount on Ledger Shop",
          "$75 yield farming bonus",
          "Advanced yield strategies",
          "Exclusive farming pools",
        ],
        nft: generateNFTData("yield_farmer", "Yield Farmer NFT"),
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
        benefits: ["8% discount on Ledger Shop", "Daily user badge", "Loyalty rewards"],
        nft: generateNFTData("daily_user", "Daily User NFT"),
      },
      {
        id: "feature_explorer",
        title: "Feature Explorer",
        description: "Try 5 different Ledger Live features",
        rarity: "uncommon" as const,
        icon: <IconsLegacy.LedgerBlueMedium size={24} />,
        condition: () => true, // Mock condition
        benefits: ["10% discount on Ledger Shop", "Feature guide", "Beta access"],
        nft: generateNFTData("feature_explorer", "Feature Explorer NFT"),
      },
      {
        id: "power_user",
        title: "Power User",
        description: "Complete 50 different actions in Ledger Live",
        rarity: "rare" as const,
        icon: <IconsLegacy.StarMedium size={24} />,
        condition: () => false, // Mock condition
        benefits: [
          "18% discount on Ledger Shop",
          "$40 rewards credit",
          "Advanced features access",
          "Power user support",
        ],
        nft: generateNFTData("power_user", "Power User NFT"),
      },
    ],
  },
];

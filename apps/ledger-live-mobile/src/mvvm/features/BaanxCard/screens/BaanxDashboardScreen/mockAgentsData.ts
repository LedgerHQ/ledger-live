export type AgentStatus = "active" | "idle";

export interface AgentActivityItem {
  readonly id: string;
  readonly action: string;
  readonly date: string;
  readonly amount?: string;
}

export interface AgentData {
  readonly id: string;
  readonly name: string;
  readonly icon: "UserCircle" | "UserShield" | "UserCheck" | "UserArrowRight" | "UserLock";
  readonly status: AgentStatus;
  readonly balance: number;
  readonly pnlPercent: number;
  readonly pnlPeriod: "24h" | "7d";
  readonly role: string;
  readonly activity: readonly AgentActivityItem[];
}

export const MOCK_AGENTS: readonly AgentData[] = [
  {
    id: "agent-dca-btc",
    name: "DCA Bitcoin",
    icon: "UserCircle",
    status: "active",
    balance: 4_521.87,
    pnlPercent: 12.4,
    pnlPeriod: "7d",
    role: "Executes a weekly dollar-cost-averaging strategy on Bitcoin. Buys a fixed EUR amount every Monday at 09:00 UTC regardless of price, targeting long-term accumulation with minimal timing risk.",
    activity: [
      { id: "a1", action: "Bought 0.0021 BTC", date: "Apr 14, 2026", amount: "$50.00" },
      { id: "a2", action: "Bought 0.0019 BTC", date: "Apr 7, 2026", amount: "$50.00" },
      { id: "a3", action: "Bought 0.0023 BTC", date: "Mar 31, 2026", amount: "$50.00" },
      { id: "a4", action: "Rebalanced allocation", date: "Mar 28, 2026" },
    ],
  },
  {
    id: "agent-yield-usdc",
    name: "Yield Farmer",
    icon: "UserShield",
    status: "active",
    balance: 12_340.5,
    pnlPercent: 5.82,
    pnlPeriod: "7d",
    role: "Monitors DeFi lending protocols for optimal USDC yield. Automatically moves funds between Aave, Compound, and Morpho to maximize APY while staying within predefined risk parameters.",
    activity: [
      { id: "b1", action: "Moved 2,000 USDC to Morpho", date: "Apr 15, 2026" },
      { id: "b2", action: "Claimed 18.4 USDC yield", date: "Apr 13, 2026", amount: "+$18.40" },
      { id: "b3", action: "Rebalanced Aave → Compound", date: "Apr 10, 2026" },
    ],
  },
  {
    id: "agent-eth-staker",
    name: "ETH Staker",
    icon: "UserCheck",
    status: "active",
    balance: 8_920.0,
    pnlPercent: -2.15,
    pnlPeriod: "24h",
    role: "Manages Ethereum staking positions across Lido and native validators. Monitors validator performance, auto-compounds rewards, and alerts on slashing events.",
    activity: [
      { id: "c1", action: "Compounded 0.012 ETH", date: "Apr 16, 2026", amount: "+$22.10" },
      { id: "c2", action: "Staked 1.5 ETH via Lido", date: "Apr 12, 2026", amount: "$2,840.00" },
      { id: "c3", action: "Validator health check", date: "Apr 11, 2026" },
    ],
  },
  {
    id: "agent-rebalancer",
    name: "Portfolio Guard",
    icon: "UserArrowRight",
    status: "idle",
    balance: 1_050.0,
    pnlPercent: 0.0,
    pnlPeriod: "7d",
    role: "Watches portfolio allocation and triggers rebalancing when any asset drifts more than 5% from target weights. Currently paused pending user review of new allocation targets.",
    activity: [
      { id: "d1", action: "Paused by user", date: "Apr 10, 2026" },
      { id: "d2", action: "Rebalanced BTC/ETH 60/40", date: "Apr 3, 2026" },
    ],
  },
  {
    id: "agent-tax-tracker",
    name: "Tax Optimizer",
    icon: "UserLock",
    status: "idle",
    balance: 0,
    pnlPercent: 0,
    pnlPeriod: "7d",
    role: "Scans transaction history to identify tax-loss harvesting opportunities. Generates quarterly reports and suggests swaps to offset realized capital gains.",
    activity: [
      { id: "e1", action: "Generated Q1 2026 report", date: "Apr 1, 2026" },
      { id: "e2", action: "Identified 3 harvest opportunities", date: "Mar 28, 2026" },
    ],
  },
];

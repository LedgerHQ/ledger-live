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
  readonly pnlAbsolute: number;
  readonly pnlPeriod: "24h" | "7d";
  readonly pnlChartData: readonly number[];
  readonly role: string;
  readonly activity: readonly AgentActivityItem[];
}

// balance = 4521.87, pnlPercent = +12.4% over 7d
// start value = 4521.87 / 1.124 ≈ 4023.46 → pnlAbsolute ≈ +498.41
// chart: daily snapshots over 7 days (Mon→Sun), ending at current balance
const DCA_BTC_CHART = [
  4023, 4078, 4155, 4098, 4210, 4315, 4280, 4370, 4425, 4390, 4468, 4480, 4522,
];

// balance = 12340.50, pnlPercent = +5.82% over 7d
// start value = 12340.50 / 1.0582 ≈ 11661.78 → pnlAbsolute ≈ +678.72
const YIELD_CHART = [
  11662, 11720, 11695, 11830, 11905, 11870, 12015, 12080, 11960, 12145, 12230, 12290, 12341,
];

export const MOCK_AGENTS: readonly AgentData[] = [
  {
    id: "agent-dca-btc",
    name: "DCA Bitcoin",
    icon: "UserCircle",
    status: "active",
    balance: 4_521.87,
    pnlPercent: 12.4,
    pnlAbsolute: 498.41,
    pnlPeriod: "7d",
    pnlChartData: DCA_BTC_CHART,
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
    pnlAbsolute: 678.72,
    pnlPeriod: "7d",
    pnlChartData: YIELD_CHART,
    role: "Monitors DeFi lending protocols for optimal USDC yield. Automatically moves funds between Aave, Compound, and Morpho to maximize APY while staying within predefined risk parameters.",
    activity: [
      { id: "b1", action: "Moved 2,000 USDC to Morpho", date: "Apr 15, 2026" },
      { id: "b2", action: "Claimed 18.4 USDC yield", date: "Apr 13, 2026", amount: "+$18.40" },
      { id: "b3", action: "Rebalanced Aave → Compound", date: "Apr 10, 2026" },
    ],
  },
];

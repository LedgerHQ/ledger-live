import { z } from "zod";
import { flagWith } from "../../define";

export const lwmWallet40 = flagWith(
  {
    tour: z.boolean(),
    lazyOnboarding: z.boolean(),
    assetSection: z.boolean(),
    operationsList: z.boolean(),
    aggregatedAssets: z.boolean(),
    myWallet: z.boolean(),
    brazePlacement: z.boolean().optional(),
    pnl: z.boolean(),
    assetDiscoverability: z.boolean(),
    earnUpselling: z.boolean().optional(),
    earnSimulator: z.boolean().optional(),
    q2Tour: z.boolean().optional(),
  },
  {
    enabled: false,
    params: {
      tour: true,
      lazyOnboarding: true,
      assetSection: false,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      assetDiscoverability: false,
      earnUpselling: false,
      earnSimulator: false,
      q2Tour: false,
    },
  },
  {
    description:
      "Master flag for the Wallet 4.0 (W40) redesign on Mobile. `enabled` turns on the W40 " +
      "shell; the `params` are the individual rollout sub-features. The Q1 wave is the shell " +
      "with these params off; the Q2 wave turns them on (mirrors the e2e FF_LWM_WALLET_40_Q1/Q2 profiles).",
    status: "rollout",
    owner: "wallet-xp",
    paramsDoc: {
      tour: "Shows the Wallet 4.0 product tour (Q1 wave).",
      lazyOnboarding: "Enables the lazy onboarding flow.",
      assetSection: "Enables the redesigned asset section on the portfolio screen.",
      operationsList: "Enables the redesigned operations (transactions) list.",
      aggregatedAssets: "Aggregates balances of the same asset across accounts.",
      myWallet: "Enables the 'My Wallet' entry point/section.",
      brazePlacement: "Enables Braze content placements within the W40 layout.",
      pnl: "Shows portfolio profit & loss (PnL).",
      assetDiscoverability: "Enables asset-discoverability entry points.",
      earnUpselling: "Shows Earn upsell surfaces within the wallet.",
      earnSimulator: "Enables the Earn rewards simulator.",
      q2Tour: "Shows the Q2 variant of the product tour (Q2 wave).",
    },
  },
);

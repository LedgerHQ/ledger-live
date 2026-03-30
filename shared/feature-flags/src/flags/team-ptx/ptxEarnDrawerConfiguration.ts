import { z } from "zod";
import { flagWith } from "../../define";

const assetsSchema = z
  .object({
    filter: z.enum(["topNetworks", "undefined"]).optional(),
    leftElement: z.enum(["apy", "marketTrend", "undefined"]).optional(),
    rightElement: z.enum(["balance", "marketTrend", "undefined"]).optional(),
  })
  .optional();

const networksSchema = z
  .object({
    leftElement: z.enum(["numberOfAccounts", "numberOfAccountsAndApy", "undefined"]).optional(),
    rightElement: z.enum(["balance", "undefined"]).optional(),
  })
  .optional();

export const ptxEarnDrawerConfiguration = flagWith(
  {
    assets: assetsSchema,
    networks: networksSchema,
  },
  {
    enabled: false,
    params: {},
  },
);

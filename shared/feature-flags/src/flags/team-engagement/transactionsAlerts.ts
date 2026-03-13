import { z } from "zod";
import { flagWith } from "../../define";

const chainwatchNetworkSchema = z.object({
  ledgerLiveId: z.string(),
  chainwatchId: z.string(),
  nbConfirmations: z.number(),
});

export const transactionsAlerts = flagWith(
  {
    chainwatchBaseUrl: z.string(),
    networks: z.array(chainwatchNetworkSchema),
  },
  {
    enabled: false,
    params: {
      chainwatchBaseUrl: "https://chainwatch.aws.stg.ldg-tech.com/v0",
      networks: [
        {
          chainwatchId: "eth",
          ledgerLiveId: "ethereum",
          nbConfirmations: 1,
        },
      ],
    },
  },
);

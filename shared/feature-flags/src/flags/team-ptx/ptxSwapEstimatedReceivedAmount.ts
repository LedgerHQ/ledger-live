import { z } from "zod";
import { flagWith } from "../../define";

export const ptxSwapEstimatedReceivedAmount = flagWith(
  {
    providers: z.record(z.string(), z.boolean()),
  },
  {
    enabled: false,
    params: {
      providers: {
        changelly: false,
        changelly_v2: false,
        exodus: false,
        cic: false,
        cic_v2: false,
        moonpay: true,
        oneinch: false,
        paraswap: false,
        thorswap: false,
        nearintents: false,
        swapsxyz: false,
        moonpay_trade: true,
        lifi: false,
        velora: false,
        okx: false,
      },
    },
  },
);

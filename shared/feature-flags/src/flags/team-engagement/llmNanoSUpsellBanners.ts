import { z } from "zod";
import { flagWith } from "../../define";

const llmNanoSUpsellBannersConfigSchema = z.object({
  manager: z.boolean(),
  accounts: z.boolean(),
  notification_center: z.boolean(),
  wallet: z.boolean().optional(),
  link: z.string(),
  "%": z.number().optional(),
});

export const llmNanoSUpsellBanners = flagWith(
  {
    opted_in: llmNanoSUpsellBannersConfigSchema,
    opted_out: llmNanoSUpsellBannersConfigSchema,
  },
  {
    enabled: false,
    params: {
      opted_in: {
        manager: true,
        accounts: true,
        notification_center: true,
        link: "https://shop.ledger.com/pages/ledger-nano-s-upgrade-program",
        "%": 20,
      },
      opted_out: {
        manager: true,
        accounts: true,
        notification_center: true,
        wallet: true,
        link: "https://support.ledger.com/article/Ledger-Nano-S-Limitations?redirect=false",
      },
    },
  },
);

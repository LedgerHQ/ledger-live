import { z } from "zod";
import { flagWith } from "../../define";

const lldNanoSUpsellBannersConfigSchema = z.object({
  manager: z.boolean(),
  accounts: z.boolean(),
  notification_center: z.boolean(),
  link: z.string(),
  img: z.string().optional(),
  "%": z.number().optional(),
});

const lldOptedOutSchema = lldNanoSUpsellBannersConfigSchema.extend({
  portfolio: z.boolean(),
});

export const lldNanoSUpsellBanners = flagWith(
  {
    opted_in: lldNanoSUpsellBannersConfigSchema,
    opted_out: lldOptedOutSchema,
  },
  {
    enabled: false,
    params: {
      opted_in: {
        manager: true,
        accounts: true,
        notification_center: true,
        link: "https://shop.ledger.com/pages/ledger-nano-s-upgrade-program",
        img: "",
        "%": 20,
      },
      opted_out: {
        manager: true,
        accounts: true,
        notification_center: true,
        portfolio: true,
        link: "https://support.ledger.com/article/Ledger-Nano-S-Limitations?redirect=false",
      },
    },
  },
);

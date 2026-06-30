import { z } from "zod";
import { flagWith } from "../../define";

const audienceModelsSchema = z.object({
  nanoS: z.boolean(),
  nanoSP: z.boolean(),
  nanoX: z.boolean(),
});

const cooldownDaysSchema = z.object({
  default: z.number(),
  nanoS: z.number().optional(),
  nanoSP: z.number().optional(),
  nanoX: z.number().optional(),
});

const modalSchema = z.object({
  enabled: z.boolean(),
  killThreshold: z.number(),
  cadenceDays: z.number(),
});

const ctaSchema = z.object({
  link: z.string(),
});

export const largeScreenUpsell = flagWith(
  {
    audience: z.object({ models: audienceModelsSchema }),
    cooldownDays: cooldownDaysSchema,
    discount: z.number(),
    modal: modalSchema,
    opted_in: ctaSchema,
    opted_out: ctaSchema,
  },
  {
    enabled: false,
    params: {
      audience: { models: { nanoS: true, nanoSP: true, nanoX: true } },
      cooldownDays: { default: 30, nanoS: 0 },
      discount: 0.2,
      modal: { enabled: true, killThreshold: 3, cadenceDays: 30 },
      opted_in: { link: "https://shop.ledger.com/pages/ledger-nano-upgrade-program" },
      opted_out: {
        link: "https://support.ledger.com/article/Ledger-Nano-Limitations?redirect=false",
      },
    },
  },
);

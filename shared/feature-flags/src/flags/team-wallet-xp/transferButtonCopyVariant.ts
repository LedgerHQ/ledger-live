import { z } from "zod";
import { flagWith } from "../../define";

export const transferButtonCopyVariant = flagWith(
  {
    variantId: z.string(),
    buttonLabel: z.string().optional(),
    modalTitle: z.string().optional(),
    rowReceiveTitle: z.string().optional(),
    rowSendTitle: z.string().optional(),
    rowCashToStableTitle: z.string().optional(),
    rowCashToStableDescription: z.string().optional(),
  },
  {
    enabled: false,
    params: {
      variantId: "control",
    },
  },
);

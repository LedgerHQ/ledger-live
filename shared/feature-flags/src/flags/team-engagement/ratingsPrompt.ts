import { z } from "zod";
import { flagWith } from "../../define";

const conditionsSchema = z.object({
  disappointed_delay: z.object({ days: z.number() }),
  minimum_accounts_number: z.number(),
  minimum_app_starts_number: z.number(),
  minimum_duration_since_app_first_start: z.object({ days: z.number() }),
  minimum_number_of_app_starts_since_last_crash: z.number(),
  not_now_delay: z.object({ days: z.number() }),
  satisfied_then_not_now_delay: z.object({ days: z.number() }),
});

const happyMomentSchema = z.object({
  route_name: z.string(),
  timer: z.number(),
  type: z.string(),
});

export const ratingsPrompt = flagWith(
  {
    conditions: conditionsSchema,
    happy_moments: z.array(happyMomentSchema),
    support_email: z.string(),
    typeform_url: z.string(),
  },
  {
    enabled: false,
    params: {
      conditions: {
        disappointed_delay: { days: 90 },
        minimum_accounts_number: 3,
        minimum_app_starts_number: 3,
        minimum_duration_since_app_first_start: { days: 3 },
        minimum_number_of_app_starts_since_last_crash: 2,
        not_now_delay: { days: 15 },
        satisfied_then_not_now_delay: { days: 3 },
      },
      happy_moments: [
        { route_name: "ReceiveConfirmation", timer: 2000, type: "on_enter" },
        {
          route_name: "ClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        { route_name: "SendValidationSuccess", timer: 2000, type: "on_enter" },
        { route_name: "MarketDetail", timer: 3000, type: "on_enter" },
      ],
      support_email: "support@ledger.com",
      typeform_url:
        "https://form.typeform.com/to/Jo7gqcB4?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank",
    },
  },
);

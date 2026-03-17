import { z } from "zod";
import { flagWith } from "../../define";

const conditionsSchema = z.object({
  disappointed_delay: z.object({ seconds: z.number() }),
  minimum_accounts_number: z.number(),
  minimum_app_starts_number: z.number(),
  minimum_duration_since_app_first_start: z.object({ seconds: z.number() }),
  minimum_number_of_app_starts_since_last_crash: z.number(),
  not_now_delay: z.object({ seconds: z.number() }),
  satisfied_then_not_now_delay: z.object({ seconds: z.number() }),
});

const happyMomentSchema = z.object({
  route_name: z.string(),
  timer: z.number(),
  type: z.string(),
});

export const npsRatingsPrompt = flagWith(
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
        disappointed_delay: { seconds: 60 },
        minimum_accounts_number: 1,
        minimum_app_starts_number: 0,
        minimum_duration_since_app_first_start: { seconds: 0 },
        minimum_number_of_app_starts_since_last_crash: 0,
        not_now_delay: { seconds: 30 },
        satisfied_then_not_now_delay: { seconds: 90 },
      },
      happy_moments: [
        {
          route_name: "ReceiveVerificationConfirmation",
          timer: 2000,
          type: "on_leave",
        },
        {
          route_name: "ClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "CosmosClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "AlgorandClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        { route_name: "SendValidationSuccess", timer: 2000, type: "on_enter" },
        { route_name: "MarketDetail", timer: 3000, type: "on_enter" },
      ],
      support_email: "support@ledger.com",
      typeform_url:
        "https://ledger.typeform.com/to/UsbZ0RBk?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank&dev=1",
    },
  },
);

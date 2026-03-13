import { z } from "zod";
import { flagWith } from "../../define";

const storylyInstanceSchema = z.object({
  testingEnabled: z.boolean(),
  token: z.string(),
  instanceId: z.string().optional(),
});

export const storyly = flagWith(
  {
    stories: z.record(z.string(), storylyInstanceSchema),
  },
  {
    enabled: false,
    params: {
      stories: {
        recoverySeed: {
          testingEnabled: false,
          instanceId: "14829",
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTQ4Mjl9.iak4gUnizDdPrEXJEV3wszzJ2YkYX-RIWDXv31aJkiE",
        },
        backupRecoverySeed: {
          testingEnabled: false,
          instanceId: "19768",
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTk3Njh9.cXofdXH2klFGH5PmkzIC5w-dgOMrrma8RpGksi0iMlk",
        },
        storylyExample: {
          testingEnabled: false,
          instanceId: "none",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjc2MCwiYXBwX2lkIjo0MDUsImluc19pZCI6NDA0fQ.1AkqOy_lsiownTBNhVOUKc91uc9fDcAxfQZtpm3nj40",
        },
        testStory: {
          testingEnabled: false,
          instanceId: "12198",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ",
        },
      },
    },
  },
);

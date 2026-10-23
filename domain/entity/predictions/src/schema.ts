import { z } from "zod";

export const PredictionsStateSchema = z.object({
  hasSeenIntro: z.boolean(),
});

export type PredictionsState = z.infer<typeof PredictionsStateSchema>;

export const initialPredictionsState: PredictionsState = { hasSeenIntro: false };

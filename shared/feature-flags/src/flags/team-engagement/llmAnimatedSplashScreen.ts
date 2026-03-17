import { z } from "zod";
import { flagWith } from "../../define";

export const llmAnimatedSplashScreen = flagWith(
  {
    ios: z.boolean().optional(),
    android: z.boolean().optional(),
    macos: z.boolean().optional(),
    windows: z.boolean().optional(),
    linux: z.boolean().optional(),
  },
  {
    enabled: true,
    params: {
      ios: true,
      android: true,
    },
  },
);
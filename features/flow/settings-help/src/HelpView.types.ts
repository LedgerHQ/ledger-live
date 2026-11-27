import type { ReactNode } from "react";
import type { HelpSlots } from "./types";
import type { HelpViewModel } from "./useHelpViewModel";

export type HelpViewProps = Omit<HelpViewModel, "screen" | "confirmationScreenName"> &
  Readonly<{
    slots: HelpSlots;
    whileConfirming?: ReactNode;
    testID?: string;
  }>;

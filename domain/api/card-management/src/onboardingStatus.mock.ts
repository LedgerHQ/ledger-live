import { PayCardOnboardingStatusResponseSchema } from "./schema";
import type { PayCardOnboardingStatus } from "./types";

type Step = PayCardOnboardingStatus["steps"][number];

const INITIAL_STEPS: readonly Step[] = PayCardOnboardingStatusResponseSchema.parse({
  steps: [
    {
      id: "create-account",
      title: "Create an account",
      description: "Sign up to start using your Ledger Card.",
      isDone: true,
    },
    {
      id: "choose-card-type",
      title: "Choose card type",
      description: "Choose between virtual and physical",
      isDone: false,
    },
    {
      id: "top-up-card",
      title: "Top up your card",
      description: "Choose USDC, USDT, BTC or more",
      isDone: false,
    },
    {
      id: "first-purchase",
      title: "Make your first purchase",
      description: "Pay online or in store",
      isDone: false,
    },
  ],
}).steps;

let steps: Step[] = INITIAL_STEPS.map(step => ({ ...step }));

export function getMockCardOnboardingStatus(): PayCardOnboardingStatus {
  return PayCardOnboardingStatusResponseSchema.parse({ steps });
}

/** Mark a single step done/undone, or pass `"all"` to update every step. */
export function setMockOnboardingStepDone(id: string, isDone: boolean): void {
  steps = steps.map(step => (id === "all" || step.id === id ? { ...step, isDone } : step));
}

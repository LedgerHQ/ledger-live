import type { PayCardAnalyticsMilestone } from "@features/flow-pay-card-widget/state";
import type { PendingPayCardAnalyticsMilestone } from "./derivePayCardAnalyticsMilestones";

type Inputs = Readonly<{
  observed: readonly PendingPayCardAnalyticsMilestone[];
  reported: readonly string[];
  isFirstRead: boolean;
}>;

type Plan = Readonly<{
  send: readonly PendingPayCardAnalyticsMilestone[];
  record: readonly PayCardAnalyticsMilestone[];
}>;

export function planPayCardMilestoneReports({ observed, reported, isFirstRead }: Inputs): Plan {
  const unreported = observed.filter(({ id }) => !reported.includes(id));

  return {
    send: isFirstRead ? [] : unreported,
    record: unreported.map(({ id }) => id),
  };
}

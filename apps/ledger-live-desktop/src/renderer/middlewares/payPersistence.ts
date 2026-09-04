import { payCardBalancePersistedSelector } from "@features/flow-pay-balance/state";
import { payCardFeatureTourPersistedSelector } from "@features/flow-pay-feature-tour/state";
import { payRequestVerifyHintPersistedSelector } from "@features/flow-pay-request/state";
import { payCardLoginIntroPersistedSelector } from "@features/flow-pay-card-auth/state";
import { setKey } from "~/renderer/storage";
import type { State } from "../reducers";

const PAY_ACTION_PREFIXES = [
  "payCardFeatureTour/",
  "payRequestVerifyHint/",
  "payCardBalance/",
  "payCardLoginIntro/",
];

export const isPayAction = (actionType: string) =>
  PAY_ACTION_PREFIXES.some(prefix => actionType.startsWith(prefix));

export const persistPayCard = (state: State) =>
  setKey("app", "payCard", {
    ...payCardFeatureTourPersistedSelector(state),
    ...payRequestVerifyHintPersistedSelector(state),
    ...payCardBalancePersistedSelector(state),
    ...payCardLoginIntroPersistedSelector(state),
  });

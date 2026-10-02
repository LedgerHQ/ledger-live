import { useFeature } from "@features/platform-feature-flags";

export type PayCardFace = "native" | "liveApp" | "disclaimer" | "hidden";

/** Which card the Pay tab shows. Only one face is on at a time; the first one on wins. */
export function usePayCardFace(): PayCardFace {
  const payTab = useFeature("lwdPayTab");
  const params = payTab?.params;

  if (!payTab?.enabled) return "hidden";
  if (params?.card_native) return "native";
  if (params?.card_live_app) return "liveApp";
  if (params?.card_disclaimer) return "disclaimer";
  return "hidden";
}

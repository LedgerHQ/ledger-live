import { useMemo } from "react";
import { AnalyticMetadata } from "./types";
import { AnalyticContexts } from "./enums";
import getAddAccountsMetadata from "./data/addAccounts";

export default function useAnalytics(
  context: "addAccounts" | "receiveFunds" | undefined,
  sourceScreenName?: string,
) {
  const analyticsMetadata = useMemo((): AnalyticMetadata => {
    switch (context) {
      case AnalyticContexts.AddAccounts:
        return getAddAccountsMetadata(sourceScreenName);
      default:
        return {};
    }
  }, [context, sourceScreenName]);

  return {
    analyticsMetadata,
  };
}

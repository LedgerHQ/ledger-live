import { getStateFromPath } from "@react-navigation/native";
import {
  validateEarnAction,
  validateEarnInfoModal,
  validateEarnMenuModal,
  validateEarnDepositScreen,
  logSecurityEvent,
  EarnDeeplinkAction,
} from "../validation";
import {
  makeSetEarnInfoModalAction,
  makeSetEarnMenuModalAction,
  makeSetEarnProtocolInfoModalAction,
} from "~/actions/earn";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://earn` and `ledgerlive://earn/deposit`
 *
 * - Validates the `action` param and dispatches modal actions for modal variants.
 * - Routes the deposit path to the earn live-app navigator with sanitised params.
 * - Returns undefined (no navigation) for pure dispatch actions (info/menu modals).
 */
export const earnHandler: DeeplinkHandler = (
  { hostname, pathname, searchParams, url },
  { dispatch, config },
) => {
  const earnParamAction = searchParams.get("action");
  const validatedAction = validateEarnAction(earnParamAction);

  if (!validatedAction && earnParamAction) {
    logSecurityEvent("blocked_action", {
      hostname,
      action: earnParamAction,
      reason: "Invalid action type",
    });
    return;
  }

  switch (validatedAction) {
    case EarnDeeplinkAction.INFO_MODAL: {
      const validatedModal = validateEarnInfoModal(
        searchParams.get("message"),
        searchParams.get("messageTitle"),
        searchParams.get("learnMoreLink"),
      );

      if (!validatedModal) {
        logSecurityEvent("validation_failed", {
          hostname,
          action: validatedAction,
          reason: "Invalid info modal parameters",
        });
        return;
      }

      dispatch(makeSetEarnInfoModalAction(validatedModal));
      return;
    }
    case EarnDeeplinkAction.MENU_MODAL: {
      const validatedModal = validateEarnMenuModal(
        searchParams.get("title"),
        searchParams.get("options"),
      );

      if (!validatedModal) {
        logSecurityEvent("validation_failed", {
          hostname,
          action: validatedAction,
          reason: "Invalid menu modal parameters",
        });
        return;
      }

      dispatch(
        makeSetEarnMenuModalAction({
          title: validatedModal.title,
          options: validatedModal.options,
        }),
      );
      return;
    }
    case EarnDeeplinkAction.PROTOCOL_INFO_MODAL: {
      dispatch(makeSetEarnProtocolInfoModalAction(true));
      return;
    }
  }

  if (pathname === "/deposit") {
    const validatedModal = validateEarnDepositScreen(
      searchParams.get("cryptoAssetId") || undefined,
      searchParams.get("accountId") || undefined,
    );
    // Handle deposit deeplink on earnLiveAppNavigator
    // Creating own search params for deposit deeplink
    url.pathname = "";
    url.searchParams.set("action", "deposit");
    url.searchParams.set("cryptoAssetId", validatedModal.cryptoAssetId ?? "");
    url.searchParams.set("accountId", validatedModal.accountId ?? "");
    return getStateFromPath(url.href?.split("://")[1], config);
  }
};

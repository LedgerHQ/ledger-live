import type { DeviceDeprecationRules, DeviceDeprecationScreenRules } from "../ConnectApp/types";
import type {
  DeprecationPresentationDecision,
  DeprecationScreenKind,
} from "./deprecationPresentationTypes";

function doesScreenApply(params: {
  rules: DeviceDeprecationScreenRules | undefined;
  flow: string;
  currencyName: string;
}): boolean {
  const { rules, flow, currencyName } = params;

  if (flow === "unknown") {
    return false;
  }

  if (!rules?.deprecatedFlow?.includes(flow)) {
    return false;
  }

  if (rules.exception?.includes(currencyName)) {
    return false;
  }

  return true;
}

/**
 * Decide how the new DIE connect-app initializer should present device deprecation.
 *
 * Dismissing a currency only suppresses the generic deprecation warning. It does
 * not suppress a clear-signing warning, which remains eligible when its own
 * rules apply. Blocking deprecation remains blocking.
 */
export function decideDeprecationPresentation(params: {
  rules: DeviceDeprecationRules;
  flow: string;
  currencyName: string;
  deprecationDismissedCurrencyNames: string[];
}): DeprecationPresentationDecision {
  const { rules, flow, currencyName, deprecationDismissedCurrencyNames } = params;

  const errorApplies =
    rules.errorScreenVisible &&
    doesScreenApply({
      rules: rules.errorScreenRules,
      flow,
      currencyName,
    });

  if (errorApplies) {
    return {
      status: "block",
      currencyName,
      deviceModelId: rules.modelId,
      supportEndDate: rules.date,
    };
  }

  const warningApplies =
    rules.warningScreenVisible &&
    doesScreenApply({
      rules: rules.warningScreenRules,
      flow,
      currencyName,
    });

  const clearSigningApplies =
    rules.clearSigningScreenVisible &&
    doesScreenApply({
      rules: rules.clearSigningScreenRules,
      flow,
      currencyName,
    });

  const warningDismissed = deprecationDismissedCurrencyNames.includes(currencyName);

  if (warningApplies && !warningDismissed) {
    const screenSequence: Array<DeprecationScreenKind> = ["warning"];
    if (clearSigningApplies) {
      screenSequence.push("clearSigning");
    }

    return {
      status: "show",
      screenSequence,
      currencyName,
      deviceModelId: rules.modelId,
      supportEndDate: rules.date,
    };
  }

  if (clearSigningApplies) {
    return {
      status: "show",
      screenSequence: ["clearSigning"],
      currencyName,
      deviceModelId: rules.modelId,
      supportEndDate: rules.date,
    };
  }

  return { status: "skipped" };
}

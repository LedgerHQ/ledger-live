// helpers for spec
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import expect from "expect";
import sample from "lodash/sample";
import { isAccountEmpty } from "../account";
import type {
  DeviceAction,
  DeviceActionArg,
  TransactionDestinationTestInput,
} from "./types";
import { Account, TransactionCommon } from "@ledgerhq/types-live";
import { botTest } from "./bot-test-context";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

export { botTest };

const stepValueTransformDefault = (s: string) => s.trim();

// TODO should weight the choice to favorize accounts with small amounts
export function pickSiblings(siblings: Account[], maxAccount = 5): Account {
  const withoutEmpties = siblings.filter((a) => a.used);

  if (withoutEmpties.length >= maxAccount) {
    // we are no longer creating accounts
    const maybeAccount = sample(withoutEmpties);
    if (!maybeAccount) {
      throw new Error(
        "at least one non-empty sibling account exists. maxAccount=" +
          maxAccount
      );
    }
    return maybeAccount;
  }

  // we are only keeping empty account that have smaller index to favorize creation of non created derivation modes
  let empties = siblings.filter(isAccountEmpty);
  empties.sort((a, b) => a.index - b.index);

  if (empties.length > 0) {
    empties = empties.filter((e) => e.index === empties[0].index);
  }

  const maybeAccount = sample(withoutEmpties.concat(empties));
  if (!maybeAccount) {
    throw new Error(
      "at least one sibling account exists. maxAccount=" + maxAccount
    );
  }
  return maybeAccount;
}

type State<T extends TransactionCommon> = {
  finalState: boolean;
  stepTitle: string;
  stepValue: string;
  acc: Array<{
    title: string;
    value: string;
  }>;
  currentStep: Step<T> | null | undefined;
};

export enum SpeculosButton {
  LEFT = "Ll",
  RIGHT = "Rr",
  BOTH = "LRlr",
}

type Step<T extends TransactionCommon> = {
  title: string;
  stepValueTransform?: (s: string) => string;
  expectedValue?: (
    arg0: DeviceActionArg<T, State<T>>,
    acc: Array<{
      title: string;
      value: string;
    }>
  ) => string;
  ignoreAssertionFailure?: boolean;
  trimValue?: boolean;
  button?: SpeculosButton;
  // action to apply in term of button press
  final?: boolean; // tells if there is no step after that and action should terminate all further action (hack to do deboncing)
  maxY?: number; // check if text is bellow a certains Y coordinate on the screen, it happened that two text have the same content but different positions
};
type FlowDesc<T extends TransactionCommon> = {
  steps: Array<Step<T>>;
  fallback?: (arg0: DeviceActionArg<T, State<T>>) => Step<T> | null | undefined;
};
// generalized logic of device actions
export function deviceActionFlow<T extends TransactionCommon>(
  description: FlowDesc<T>
): DeviceAction<T, State<T>> {
  return (arg: DeviceActionArg<T, State<T>>) => {
    invariant(
      arg.appCandidate.model === "nanoS",
      "FIXME: stepper logic is only implemented for Nano S"
    );
    const { transport, event, state, disableStrictStepValueValidation } = arg;
    let { finalState, stepTitle, stepValue, acc, currentStep } = state || {
      finalState: false,
      stepTitle: "",
      stepValue: "",
      acc: [],
      currentStep: null,
    };

    function runStep(step: Step<T>) {
      const { final, title, button } = step;

      if (stepValue && step.title !== stepTitle) {
        // there were accumulated text and we are on new step, we need to release it and compare to expected
        if (currentStep && currentStep.expectedValue) {
          const { expectedValue, ignoreAssertionFailure } = currentStep;
          const stepValueTransform =
            currentStep.stepValueTransform || stepValueTransformDefault;

          if (!ignoreAssertionFailure && !disableStrictStepValueValidation) {
            botTest("deviceAction confirm step '" + stepTitle + "'", () =>
              expect({
                [stepTitle]: stepValueTransform(stepValue),
              }).toMatchObject({
                [stepTitle]: expectedValue(arg, acc).trim(),
              })
            );
          }
        }

        acc = acc.concat({
          title: stepTitle,
          value: stepValue,
        });
        // a new step reset back the value for the next
        stepValue = "";
      }

      if (button) {
        // some step trigger navigation action
        transport.button(button);
      }

      // text is the title of the step. we assume screen event starts / ends.
      stepTitle = title;
      currentStep = step;

      if (final) {
        finalState = true;
      }
    }

    if (!finalState) {
      let possibleKnownStep: Step<T> | null | undefined =
        description.steps.find((s) => {
          if (s.maxY) {
            return event.text.startsWith(s.title) && event.y < s.maxY;
          }
          return event.text.startsWith(s.title);
        });

      // if there is a fallback provided, we will run it to try to detect another possible known step
      if (!possibleKnownStep && description.fallback) {
        possibleKnownStep = description.fallback(arg);
      }

      if (possibleKnownStep) {
        // a step title was recognized. run it as a new step
        runStep(possibleKnownStep);
      } else if (currentStep) {
        // there is a current ongoing step so we need to accumulate all text we see
        let { text } = event;
        if (currentStep.trimValue) text = text.trim();
        stepValue += text;
      }
    }

    log("bot/flow", `'${event.text}' ~> ${stepTitle}: ${stepValue}`);
    return {
      finalState,
      stepTitle,
      stepValue,
      acc,
      currentStep,
    };
  };
}

type DeviceAmountFormatOptions = {
  // the ticker of the coin is AFTER the amount on the device (e.g. "600.1 USDT")
  postfixCode: boolean;
  // the device shows "42" as "42.0"
  forceFloating: boolean;
  // device don't even display the code (unit ticker)
  hideCode: boolean;
  // force the visibility of all digits of the amount
  showAllDigits: boolean;
};
const defaultFormatOptions: DeviceAmountFormatOptions = {
  postfixCode: false,
  forceFloating: false,
  hideCode: false,
  showAllDigits: false,
};

const sep = " ";
export function formatDeviceAmount(
  currency: CryptoCurrency | TokenCurrency,
  value: BigNumber,
  options: Partial<DeviceAmountFormatOptions> = defaultFormatOptions
): string {
  const [unit] = currency.units;
  let code = unit.code;
  if (currency.type === "CryptoCurrency") {
    const { deviceTicker } = currency;
    if (deviceTicker) code = deviceTicker;
  }
  const fValue = value.div(new BigNumber(10).pow(unit.magnitude));
  let v = options.showAllDigits
    ? fValue.toFixed(unit.magnitude)
    : fValue.toString(10);
  if (options.forceFloating) {
    if (!v.includes(".")) {
      // if the value is pure integer, in the app it will automatically add an .0
      v += ".0";
    }
  }
  if (options.hideCode) return v;
  return options.postfixCode ? v + sep + code : code + sep + v;
}

// this function throw if the portion of undelegated funds is smaller than the threshold
// where threshold is a value from 0.0 to 1.0, percentage of the total amount of funds
// Usage: put these in your spec, on the mutation transaction functions that intend to do more "delegations"
export function expectSiblingsHaveSpendablePartGreaterThan(
  siblings: Account[],
  threshold: number
): void {
  const spendableTotal = siblings.reduce(
    (acc, a) => acc.plus(a.spendableBalance),
    new BigNumber(0)
  );
  const total = siblings.reduce(
    (acc, a) => acc.plus(a.balance),
    new BigNumber(0)
  );
  invariant(
    spendableTotal.div(total).gt(threshold),
    "the spendable part of accounts is sufficient (threshold: %s)",
    threshold
  );
}

export const genericTestDestination = <T>({
  destination,
  operation,
  destinationBeforeTransaction,
  sendingOperation,
}: TransactionDestinationTestInput<T>): void => {
  const amount = sendingOperation.value.minus(sendingOperation.fee);
  botTest("account balance increased with transaction amount", () =>
    expect(destination.balance.toString()).toBe(
      destinationBeforeTransaction.balance.plus(amount).toString()
    )
  );
  botTest("operation amount is consistent with sendingOperation", () =>
    expect({
      type: operation.type,
      amount: operation.value.toString(),
    }).toMatchObject({
      type: "IN",
      amount: amount.toString(),
    })
  );
};

// @flow
// helpers for spec
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import expect from "expect";
import sample from "lodash/sample";
import { isAccountEmpty } from "../account";
import type { DeviceAction, DeviceActionArg } from "./types";
import type { Account, Transaction } from "../types";

// TODO should weight the choice to favorize accounts with small amounts
export function pickSiblings(
  siblings: Account[],
  maxAccount: number = 5
): Account {
  const withoutEmpties = siblings.filter((a) => a.used);
  if (siblings.length > maxAccount) {
    // we are no longer creating accounts
    return sample(withoutEmpties);
  }

  // we are only keeping empty account that have smaller index to favorize creation of non created derivation modes
  let empties = siblings.filter(isAccountEmpty);
  empties.sort((a, b) => a.index - b.index);
  if (empties.length > 0) {
    empties = empties.filter((e) => e.index === empties[0].index);
  }

  return sample(withoutEmpties.concat(empties));
}

type State<T: Transaction> = {
  finalState: boolean,
  stepTitle: string,
  stepValue: string,
  acc: Array<{ title: string, value: string }>,
  currentStep: ?Step<T>,
};

type Step<T: Transaction> = {
  title: string,
  expectedValue?: (
    DeviceActionArg<T, State<T>>,
    acc: Array<{ title: string, value: string }>
  ) => string,
  ignoreAssertionFailure?: boolean,
  trimValue?: boolean,
  button?: string, // action to apply in term of button press
  final?: boolean, // tells if there is no step after that and action should terminate all further action (hack to do deboncing)
};

type FlowDesc<T: Transaction> = {
  steps: Array<Step<T>>,
  fallback?: (DeviceActionArg<T, State<T>>) => ?Step<T>,
};

// generalized logic of device actions
export function deviceActionFlow<T: Transaction>(
  description: FlowDesc<T>
): DeviceAction<T, State<T>> {
  return (arg: DeviceActionArg<T, State<T>>) => {
    invariant(
      arg.appCandidate.model === "nanoS",
      "FIXME: stepper logic is only implemented for Nano S"
    );

    const { transport, event, state } = arg;
    let { finalState, stepTitle, stepValue, acc, currentStep } = state || {
      finalState: false,
      stepTitle: "",
      stepValue: "",
      acc: [],
      currentStep: null,
    };

    function runStep(step) {
      const { final, title, button } = step;
      if (stepValue && step.title !== stepTitle) {
        // there were accumulated text and we are on new step, we need to release it and compare to expected
        if (currentStep && currentStep.expectedValue) {
          const { expectedValue, ignoreAssertionFailure } = currentStep;
          if (!ignoreAssertionFailure) {
            expect({
              [stepTitle]: stepValue.trim(),
            }).toMatchObject({
              [stepTitle]: expectedValue(arg, acc).trim(),
            });
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
      let possibleKnownStep = description.steps.find((s) =>
        event.text.startsWith(s.title)
      );
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
    return { finalState, stepTitle, stepValue, acc, currentStep };
  };
}

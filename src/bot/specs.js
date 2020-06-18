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
  const withoutEmpties = siblings.filter((a) => !isAccountEmpty(a));
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

type State = {
  finalState: boolean,
  stepTitle: string,
  stepValue: string,
  acc: Array<{ title: string, value: string }>,
};

type FlowDesc<T: Transaction> = {
  steps: Array<{
    title: string,
    expectedValue?: (
      DeviceActionArg<T, State>,
      acc: Array<{ title: string, value: string }>
    ) => string,
    ignoreAssertionFailure?: boolean,
    trimValue?: boolean,
    button?: string, // action to apply in term of button press
    final?: boolean, // tells if there is no step after that and action should terminate all further action (hack to do deboncing)
  }>,
};

// generalized logic of device actions
export function deviceActionFlow<T: Transaction>(
  description: FlowDesc<T>
): DeviceAction<T, State> {
  return (arg: DeviceActionArg<T, State>) => {
    invariant(
      arg.appCandidate.model === "nanoS",
      "FIXME: stepper logic is only implemented for Nano S"
    );

    const { transport, event, state } = arg;
    let { finalState, stepTitle, stepValue, acc } = state || {
      finalState: false,
      stepTitle: "",
      stepValue: "",
      acc: [],
    };

    if (!finalState) {
      const possibleKnownStep = description.steps.find((s) =>
        event.text.startsWith(s.title)
      );
      const prev = description.steps.find((s) => s.title === stepTitle);
      if (possibleKnownStep) {
        const { final, title, button } = possibleKnownStep;
        if (stepValue && possibleKnownStep.title !== stepTitle) {
          // there were accumulated text and we are on new step, we need to release it and compare to expected
          if (prev && prev.expectedValue) {
            const { expectedValue, ignoreAssertionFailure } = prev;
            if (!ignoreAssertionFailure) {
              expect({
                [stepTitle]: stepValue,
              }).toMatchObject({
                [stepTitle]: expectedValue(arg, acc),
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
        if (final) {
          finalState = true;
        }
      } else if (prev) {
        let { text } = event;
        if (prev.trimValue) text = text.trim();
        stepValue += text;
      }
    }

    log("bot/flow", `'${event.text}' ~> ${stepTitle}: ${stepValue}`);
    return { finalState, stepTitle, stepValue, acc };
  };
}

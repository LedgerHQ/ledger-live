import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import onboardingReducer, {
  addAccountResumed,
  addAccountSentToOnboarding,
  addAccountStarted,
  addAccountToResumeSelector,
  type OnboardingState,
} from "../onboarding";
import type { State } from "..";

describe("onboarding reducer - Add Account resume", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const reduce = (...actions: Parameters<typeof onboardingReducer>[1][]) =>
    actions.reduce(onboardingReducer, onboardingReducer(undefined, { type: "@@INIT" }));
  const toResume = (onboarding: OnboardingState) =>
    addAccountToResumeSelector({ onboarding } as State);

  it("has nothing to resume by default", () => {
    expect(toResume(reduce())).toBeNull();
  });

  it("does not resume an Add Account flow that was not sent to onboarding", () => {
    expect(
      toResume(reduce(addAccountStarted({ returnTo: "/accounts", currency: bitcoin }))),
    ).toBeNull();
  });

  it("resumes the Add Account flow sent to onboarding, where it started", () => {
    const state = reduce(
      addAccountStarted({ returnTo: "/accounts", currency: bitcoin }),
      addAccountSentToOnboarding(),
    );
    expect(toResume(state)).toEqual({
      returnTo: "/accounts",
      currency: bitcoin,
      awaitingOnboarding: true,
    });
  });

  it("ignores a send to onboarding without an Add Account flow", () => {
    expect(toResume(reduce(addAccountSentToOnboarding()))).toBeNull();
  });

  it("drops the resume once resumed, or when a new Add Account flow starts", () => {
    const sent = [
      addAccountStarted({ returnTo: "/", currency: bitcoin }),
      addAccountSentToOnboarding(),
    ];
    expect(toResume(reduce(...sent, addAccountResumed()))).toBeNull();
    expect(
      toResume(reduce(...sent, addAccountStarted({ returnTo: "/swap", currency: bitcoin }))),
    ).toBeNull();
  });
});

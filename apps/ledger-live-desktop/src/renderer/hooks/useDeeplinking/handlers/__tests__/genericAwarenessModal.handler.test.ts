import { setGenericAwarenessModalCampaignId } from "~/renderer/reducers/genericAwarenessModalSlice";
import { genericAwarenessModalHandler } from "../genericAwarenessModal.handler";
import { createMockContext } from "./test-utils";
import type { AppDispatch } from "~/state-manager/configureStore";

describe("genericAwarenessModalHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function runDispatchedThunk(context: ReturnType<typeof createMockContext>) {
    const dispatchMock = context.dispatch as jest.Mock;
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const thunk = dispatchMock.mock.calls[0][0] as (
      d: AppDispatch,
      getState: () => unknown,
    ) => void;
    const inner = jest.fn();
    thunk(inner as AppDispatch, () => ({
      settings: { dismissedContentCards: {} },
      genericAwarenessModal: { contentCards: [], campaignId: undefined },
    }));
    return inner;
  }

  it("opens Generic Awareness modal when onboarding is complete and feature flag is enabled", () => {
    const context = createMockContext({
      hasCompletedOnboarding: true,
      isGenericAwarenessModalEnabled: true,
    });

    genericAwarenessModalHandler({ type: "generic-awareness-modal" }, context);

    const inner = runDispatchedThunk(context);
    expect(inner.mock.calls).toEqual([[setGenericAwarenessModalCampaignId(undefined)]]);
  });

  it("passes route id through open thunk", () => {
    const context = createMockContext({
      hasCompletedOnboarding: true,
      isGenericAwarenessModalEnabled: true,
    });

    genericAwarenessModalHandler({ type: "generic-awareness-modal", id: "braze-intro" }, context);

    const inner = runDispatchedThunk(context);
    expect(inner.mock.calls).toEqual([[setGenericAwarenessModalCampaignId("braze-intro")]]);
  });

  it("does not open the modal when onboarding is incomplete", () => {
    const context = createMockContext({
      hasCompletedOnboarding: false,
      isGenericAwarenessModalEnabled: true,
    });

    genericAwarenessModalHandler({ type: "generic-awareness-modal" }, context);

    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it("does not open the modal when lwdGenericAwarenessModal feature flag is disabled", () => {
    const context = createMockContext({
      hasCompletedOnboarding: true,
      isGenericAwarenessModalEnabled: false,
    });

    genericAwarenessModalHandler({ type: "generic-awareness-modal" }, context);

    expect(context.dispatch).not.toHaveBeenCalled();
  });
});

import { InteractionManager } from "react-native";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { useRefreshAccountsOrderingAfterInteractions } from "./general";

const mockDispatch = jest.fn();

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

describe("useRefreshAccountsOrderingAfterInteractions", () => {
  let runAfterInteractionsSpy: jest.SpyInstance;
  let scheduledInteractions: { callback: () => void; cancelled: boolean }[];

  const flushScheduledInteractions = () => {
    scheduledInteractions.forEach(interaction => {
      if (!interaction.cancelled) {
        interaction.callback();
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    scheduledInteractions = [];
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation(
        (task?: Parameters<typeof InteractionManager.runAfterInteractions>[0]) => {
          const interactionTask = Promise.resolve() as unknown as ReturnType<
            typeof InteractionManager.runAfterInteractions
          >;
          interactionTask.done = jest.fn();

          if (typeof task === "function") {
            const interaction = {
              callback: task,
              cancelled: false,
            };
            scheduledInteractions.push(interaction);
            interactionTask.cancel = () => {
              interaction.cancelled = true;
            };
          } else {
            interactionTask.cancel = jest.fn();
          }

          return interactionTask;
        },
      );
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
  });

  it("should defer accounts ordering refresh until interactions finish", async () => {
    const { result } = renderHook(() => useRefreshAccountsOrderingAfterInteractions());

    act(() => {
      result.current();
    });

    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => {
      flushScheduledInteractions();
    });

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
  });

  it("should not refresh accounts ordering when cleaning up before interactions finish", () => {
    const { result } = renderHook(() => useRefreshAccountsOrderingAfterInteractions());

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current();
    });
    cleanup?.();

    act(() => {
      flushScheduledInteractions();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

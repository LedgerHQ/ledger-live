import React from "react";
import { render } from "@tests/test-renderer";
import { EarnInfoBottomSheet } from "../EarnInfoBottomSheet";
import { InfoBottomSheet } from "~/components/WebPTXPlayer/InfoBottomSheet";
import { State } from "~/reducers/types";

type CapturedProps = React.ComponentProps<typeof InfoBottomSheet>;

const captured: { current: CapturedProps | undefined } = { current: undefined };

jest.mock("~/components/WebPTXPlayer/InfoBottomSheet", () => ({
  InfoBottomSheet: jest.fn((props: CapturedProps) => {
    captured.current = props;
    return null;
  }),
}));

const renderEarnInfoBottomSheet = (infoBottomSheet: State["earn"]["infoBottomSheet"]) =>
  render(<EarnInfoBottomSheet />, {
    overrideInitialState: (state: State) => ({
      ...state,
      earn: {
        ...state.earn,
        infoBottomSheet,
      },
    }),
  });

describe("EarnInfoBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    captured.current = undefined;
  });

  it("forwards the earn info bottom sheet state to InfoBottomSheet", () => {
    const data = { title: "Earn info title", message: "Earn info message body" };
    renderEarnInfoBottomSheet(data);

    expect(captured.current?.data).toEqual(data);
  });

  it("passes undefined data when the slice has no info bottom sheet", () => {
    renderEarnInfoBottomSheet(undefined);

    expect(captured.current?.data).toBeUndefined();
  });

  it("clears the earn info bottom sheet state when onClose is invoked", () => {
    const { store } = renderEarnInfoBottomSheet({ title: "Title", message: "Message" });

    captured.current?.onClose();

    expect(store.getState().earn.infoBottomSheet).toBeUndefined();
  });
});

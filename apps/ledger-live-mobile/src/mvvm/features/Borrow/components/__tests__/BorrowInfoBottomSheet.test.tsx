import React from "react";
import { render } from "@tests/test-renderer";
import { BorrowInfoBottomSheet } from "../BorrowInfoBottomSheet";
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

const renderBorrowInfoBottomSheet = (infoBottomSheet: State["borrow"]["infoBottomSheet"]) =>
  render(<BorrowInfoBottomSheet />, {
    overrideInitialState: (state: State) => ({
      ...state,
      borrow: {
        ...state.borrow,
        infoBottomSheet,
      },
    }),
  });

describe("BorrowInfoBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    captured.current = undefined;
  });

  it("forwards the borrow info bottom sheet state to InfoBottomSheet", () => {
    const data = { title: "Borrow info title", message: "Borrow info message body" };
    renderBorrowInfoBottomSheet(data);

    expect(captured.current?.data).toEqual(data);
  });

  it("passes undefined data when the slice has no info bottom sheet", () => {
    renderBorrowInfoBottomSheet(undefined);

    expect(captured.current?.data).toBeUndefined();
  });

  it("clears the borrow info bottom sheet state when onClose is invoked", () => {
    const { store } = renderBorrowInfoBottomSheet({ title: "Title", message: "Message" });

    captured.current?.onClose();

    expect(store.getState().borrow.infoBottomSheet).toBeUndefined();
  });
});

import React from "react";
import { Text } from "react-native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateStepLayout } from ".";

// Wraps the real sheet to observe the props the layout configures it with.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

type LayoutProps = Partial<React.ComponentProps<typeof OsUpdateStepLayout>>;

const renderLayout = (props: LayoutProps = {}) =>
  render(<OsUpdateStepLayout onUserClose={jest.fn()} isCloseConfirmationOpen={false} {...props} />);

describe("OsUpdateStepLayout", () => {
  beforeEach(() => {
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  it("renders the navigation bar and the screen and no sheet content when there is no sheet", () => {
    renderLayout({ screen: <Text>the screen</Text> });

    expect(screen.getByTestId("os-update-nav-bar")).toBeVisible();
    expect(screen.getByText("the screen")).toBeVisible();
    expect(screen.queryByText("the sheet")).toBeNull();
    expect(sheetProps()?.isRequestingToBeOpened).toBe(false);
  });

  it("renders the sheet content over the screen", () => {
    renderLayout({ screen: <Text>the screen</Text>, sheet: { content: <Text>the sheet</Text> } });

    expect(screen.getByText("the screen")).toBeVisible();
    expect(screen.getByText("the sheet")).toBeVisible();
    expect(sheetProps()?.isRequestingToBeOpened).toBe(true);
  });

  it("asks to close from the navigation bar", async () => {
    const onUserClose = jest.fn();
    const { user } = renderLayout({ onUserClose });

    await user.press(screen.getByTestId("os-update-close-button"));

    expect(onUserClose).toHaveBeenCalledTimes(1);
  });

  it("asks to close from the sheet, by its cross and its backdrop", () => {
    const onUserClose = jest.fn();
    renderLayout({ onUserClose, sheet: { content: <Text>the sheet</Text> } });

    expect(sheetProps()).toMatchObject({
      onHeaderClosePressed: onUserClose,
      onBackdropPress: onUserClose,
      noCloseButton: false,
    });
  });

  it("yields the sheet to the close confirmation while it is open", () => {
    renderLayout({ sheet: { content: <Text>the sheet</Text> }, isCloseConfirmationOpen: true });

    expect(sheetProps()?.isRequestingToBeOpened).toBe(false);
  });

  it("brings the sheet back once the close confirmation is dismissed", () => {
    const { rerender } = renderLayout({
      sheet: { content: <Text>the sheet</Text> },
      isCloseConfirmationOpen: true,
    });

    rerender(
      <OsUpdateStepLayout
        sheet={{ content: <Text>the sheet</Text> }}
        onUserClose={jest.fn()}
        isCloseConfirmationOpen={false}
      />,
    );

    expect(sheetProps()?.isRequestingToBeOpened).toBe(true);
  });
});

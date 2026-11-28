import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LargeScreenUpsellModalView } from "./LargeScreenUpsellModalView";
import type { LargeScreenUpsellModalViewModel } from "./types";

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void };
type DialogContentProps = { onPointerDownOutside: () => void; onEscapeKeyDown: () => void };
type DialogHeaderProps = { onClose: () => void };

const mockDialog = jest.fn<void, [DialogProps]>();
const mockDialogContent = jest.fn<void, [DialogContentProps]>();
const mockDialogHeader = jest.fn<void, [DialogHeaderProps]>();

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Dialog: (props: DialogProps & { children: React.ReactNode }) => {
    mockDialog(props);
    return <div data-open={String(props.open)}>{props.children}</div>;
  },
  DialogContent: (props: DialogContentProps & { children: React.ReactNode }) => {
    mockDialogContent(props);
    return <section>{props.children}</section>;
  },
  DialogHeader: (props: DialogHeaderProps) => {
    mockDialogHeader(props);
    return <header />;
  },
  DialogBody: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

function viewModel(): LargeScreenUpsellModalViewModel {
  return {
    isOpen: true,
    imageSrc: "hero.webp",
    title: "Upgrade your device",
    subtitle: "Get a larger screen",
    primaryButtonLabel: "Learn more",
    onDismiss: jest.fn(),
    onCtaPress: jest.fn(),
  };
}

function lastProps<T>(mock: jest.Mock<void, [T]>): T {
  return mock.mock.calls[mock.mock.calls.length - 1][0];
}

describe("LargeScreenUpsellModalView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the modal content in an open dialog", () => {
    const markup = renderToStaticMarkup(<LargeScreenUpsellModalView {...viewModel()} />);

    expect(markup).toContain('data-open="true"');
    expect(markup).toContain("Upgrade your device");
    expect(markup).toContain("<button>Learn more</button>");
  });

  it("should dismiss with the matching method for each close interaction", () => {
    const props = viewModel();
    renderToStaticMarkup(<LargeScreenUpsellModalView {...props} />);

    lastProps(mockDialogHeader).onClose();
    lastProps(mockDialogContent).onPointerDownOutside();
    lastProps(mockDialogContent).onEscapeKeyDown();
    lastProps(mockDialog).onOpenChange(false);

    expect(props.onDismiss).toHaveBeenNthCalledWith(1, "close button");
    expect(props.onDismiss).toHaveBeenNthCalledWith(2, "outside tap");
    expect(props.onDismiss).toHaveBeenNthCalledWith(3, "escape key down");
    expect(props.onDismiss).toHaveBeenNthCalledWith(4, "close button");
  });

  it("should not dismiss when the dialog reports it opened", () => {
    const props = viewModel();
    renderToStaticMarkup(<LargeScreenUpsellModalView {...props} />);

    lastProps(mockDialog).onOpenChange(true);

    expect(props.onDismiss).not.toHaveBeenCalled();
  });
});

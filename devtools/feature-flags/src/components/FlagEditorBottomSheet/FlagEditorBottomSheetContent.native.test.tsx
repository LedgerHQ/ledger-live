import { render, screen, userEvent, BottomSheetWrapper } from "jest/render.native";
import { useJsonEditor, type JsonEditorPropsState } from "../../hooks/useJsonEditor";
import type { FlagDisplayState } from "../../types";
import { FlagEditorBottomSheetContent } from "./FlagEditorBottomSheetContent.native";

jest.mock("../../hooks/useJsonEditor", () => ({
  useJsonEditor: jest.fn(),
}));

const mockedUseJsonEditor = jest.mocked(useJsonEditor);

function mockEditor(overrides: Partial<JsonEditorPropsState> = {}) {
  mockedUseJsonEditor.mockReturnValue({
    currentJsonFlag: "{}",
    diffJson: [],
    diffBaseline: "default",
    setDiffBaseline: jest.fn(),
    setCurrentJsonFlag: jest.fn(),
    overrideWithJson: jest.fn(),
    resetJson: jest.fn(),
    isJsonValid: true,
    applyDisabled: false,
    toggleFeatureFlag: jest.fn(),
    ...overrides,
  });
}

const makeDisplay = (overrides: Partial<FlagDisplayState> = {}): FlagDisplayState => ({
  id: "mockFeature",
  resolved: { enabled: true },
  isOverridden: false,
  ...overrides,
});

const makeProps = (display: FlagDisplayState) => ({
  display,
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
});

const renderContent = (props: ReturnType<typeof makeProps>) =>
  render(<FlagEditorBottomSheetContent {...props} />, { wrapper: BottomSheetWrapper });

describe("FlagEditorBottomSheetContent (native)", () => {
  beforeEach(() => mockEditor());

  it("uses the flag id as the title", () => {
    renderContent(makeProps(makeDisplay()));
    expect(screen.getByText("mockFeature")).toBeOnTheScreen();
  });

  it("labels the switch 'Enabled' when the flag is on", () => {
    renderContent(makeProps(makeDisplay({ resolved: { enabled: true } })));
    expect(screen.getByText("Enabled")).toBeOnTheScreen();
  });

  it("labels the switch 'Disabled' when the flag is off", () => {
    renderContent(makeProps(makeDisplay({ resolved: { enabled: false } })));
    expect(screen.getByText("Disabled")).toBeOnTheScreen();
  });

  it("disables Restore when the flag is not overridden", () => {
    renderContent(makeProps(makeDisplay({ isOverridden: false })));
    expect(screen.getByRole("button", { name: "Restore" })).toBeDisabled();
  });

  it("enables Restore when the flag is overridden", () => {
    renderContent(makeProps(makeDisplay({ isOverridden: true })));
    expect(screen.getByRole("button", { name: "Restore" })).toBeEnabled();
  });

  it("clears the override for the flag when Restore is pressed", async () => {
    const user = userEvent.setup();
    const props = makeProps(makeDisplay({ isOverridden: true }));
    renderContent(props);
    await user.press(screen.getByRole("button", { name: "Restore" }));
    expect(props.clearOverride).toHaveBeenCalledWith("mockFeature");
  });
});

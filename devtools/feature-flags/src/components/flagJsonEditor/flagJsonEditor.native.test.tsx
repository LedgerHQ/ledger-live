import { render, screen, userEvent } from "jest/render.native";
import type { DiffLine } from "../../utils";
import { FlagJsonEditor, type FlagJsonEditorProps } from "./flagJsonEditor";

const diffJson: DiffLine[] = [
  { state: "none", text: "{" },
  { state: "removed", text: '  "enabled": false' },
  { state: "added", text: '  "enabled": true' },
  { state: "none", text: "}" },
];

const makeProps = (overrides: Partial<FlagJsonEditorProps> = {}): FlagJsonEditorProps => ({
  value: '{ "enabled": true }',
  onChange: jest.fn(),
  isValidJson: true,
  diffJson,
  diffBaseline: "default",
  setDiffBaseline: jest.fn(),
  ...overrides,
});

describe("FlagJsonEditor (native)", () => {
  describe("editor view (default)", () => {
    it("renders the input with the current value", () => {
      render(<FlagJsonEditor {...makeProps()} />);
      expect(screen.getByDisplayValue('{ "enabled": true }')).toBeOnTheScreen();
    });

    it("calls onChange when the input is edited", async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps({ value: "", onChange })} />);
      await user.type(screen.getByDisplayValue(""), "x");
      expect(onChange).toHaveBeenCalledWith("x");
    });
  });

  describe("diff view", () => {
    it("hides the input and shows the diff when Review Changes is selected", async () => {
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps()} />);
      await user.press(screen.getByRole("button", { name: "Review Changes" }));
      expect(screen.queryByDisplayValue('{ "enabled": true }')).toBeNull();
      expect(screen.getByText(/"enabled": true/)).toBeOnTheScreen();
    });

    it("returns to the input when JSON Editor is selected again", async () => {
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps()} />);
      await user.press(screen.getByRole("button", { name: "Review Changes" }));
      await user.press(screen.getByRole("button", { name: "JSON Editor" }));
      expect(screen.getByDisplayValue('{ "enabled": true }')).toBeOnTheScreen();
    });

    it("compares with the resolved baseline when Resolved is pressed", async () => {
      const setDiffBaseline = jest.fn();
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps({ setDiffBaseline })} />);
      await user.press(screen.getByRole("button", { name: "Review Changes" }));
      await user.press(screen.getByRole("button", { name: "Resolved" }));
      expect(setDiffBaseline).toHaveBeenCalledWith("resolved");
    });

    it("compares with the default baseline when Defaults is pressed", async () => {
      const setDiffBaseline = jest.fn();
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps({ setDiffBaseline })} />);
      await user.press(screen.getByRole("button", { name: "Review Changes" }));
      await user.press(screen.getByRole("button", { name: "Defaults" }));
      expect(setDiffBaseline).toHaveBeenCalledWith("default");
    });
  });
});

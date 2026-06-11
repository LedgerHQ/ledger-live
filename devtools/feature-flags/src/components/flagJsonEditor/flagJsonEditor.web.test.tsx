import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DiffLine } from "../../utils";
import { FlagJsonEditor } from "./flagJsonEditor.web";
import type { FlagJsonEditorProps } from "./flagJsonEditor.web";

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

describe("FlagJsonEditor", () => {
  describe("editor view (default)", () => {
    it("renders the textarea with the current value", () => {
      render(<FlagJsonEditor {...makeProps()} />);
      expect(screen.getByRole("textbox")).toHaveValue('{ "enabled": true }');
    });

    it("calls onChange when the textarea is edited", () => {
      const onChange = jest.fn();
      render(<FlagJsonEditor {...makeProps({ onChange })} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: '{ "enabled": false }' } });
      expect(onChange).toHaveBeenCalledWith('{ "enabled": false }');
    });

    it("does not show the error border when the JSON is valid", () => {
      render(<FlagJsonEditor {...makeProps({ isValidJson: true })} />);
      expect(screen.getByRole("textbox")).not.toHaveClass("border-error");
    });

    it("shows the error border when the JSON is invalid", () => {
      render(<FlagJsonEditor {...makeProps({ isValidJson: false })} />);
      expect(screen.getByRole("textbox")).toHaveClass("border-error");
    });
  });

  describe("diff view", () => {
    it("hides the textarea and shows the diff when FlagDiff is selected", async () => {
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps()} />);
      await user.click(screen.getByRole("button", { name: "Review Changes" }));
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByText(/"enabled": true/)).toBeInTheDocument();
    });

    it("returns to the textarea when FlagJsonEditor is selected again", async () => {
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps()} />);
      await user.click(screen.getByRole("button", { name: "Review Changes" }));
      await user.click(screen.getByRole("button", { name: "JSON Editor" }));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("calls setDiffBaseline with 'resolved' when Resolved is clicked", async () => {
      const setDiffBaseline = jest.fn();
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps({ setDiffBaseline })} />);
      await user.click(screen.getByRole("button", { name: "Review Changes" }));

      await user.click(screen.getByRole("button", { name: "Resolved" }));
      expect(setDiffBaseline).toHaveBeenCalledWith("resolved");
    });

    it("calls setDiffBaseline with 'default' when Default is clicked", async () => {
      const setDiffBaseline = jest.fn();
      const user = userEvent.setup();
      render(<FlagJsonEditor {...makeProps({ setDiffBaseline })} />);
      await user.click(screen.getByRole("button", { name: "Review Changes" }));
      await user.click(screen.getByRole("button", { name: "Defaults" }));
      expect(setDiffBaseline).toHaveBeenCalledWith("default");
    });
  });
});

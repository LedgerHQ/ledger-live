import React, { useState } from "react";
import { type Meta, type StoryObj } from "@storybook/react";
import { expect, fn, Mock, userEvent, waitFor, within } from "@storybook/test";
import { useDebouncedCallback } from ".";

const callback1 = fn();
const callback2 = fn();

const meta: Meta<typeof Template> = {
  component: Template,
  title: "PreLdls/Hooks/useDebouncedCallback",
  tags: ["!autodocs"],
  args: {
    delay: 100,
    callback1,
    callback2,
  },
};
export default meta;

export const Test: StoryObj<typeof Template> = {
  name: "useDebouncedCallback",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    const callback2Btn = canvas.getByText("Use Callback 2");

    await step("Debounce callback calls", async () => {
      await userEvent.type(input, "Write something");
      expect(input).toHaveValue("Write something");
      expect(callback1).not.toHaveBeenCalled();
      await waitFor(() => expect(callback1).toHaveBeenCalledTimes(1), { timeout: 200 });
      expect(callback1).toHaveBeenCalledWith("Write something");
    });

    await step("Switch callback function", async () => {
      await userEvent.type(input, " else");
      await userEvent.click(callback2Btn);
      await userEvent.type(input, ".");
      await waitFor(() => expect(callback2).toHaveBeenCalledTimes(1), { timeout: 200 });
      expect(callback1).not.toHaveBeenCalledWith(/^Write something else.*/);
      expect(callback2).toHaveBeenCalledWith("Write something else.");
    });
  },
};

type TemplateProps = {
  delay: number;
  callback1: Mock;
  callback2: Mock;
};
function Template({ callback1, callback2, delay }: TemplateProps) {
  const [callback, setCallback] = useState(() => callback1);
  const debouncedCallback = useDebouncedCallback(callback, delay);

  const [value, setValue] = useState("");
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={event => {
          const value = event.target.value;
          setValue(value);
          debouncedCallback?.(value);
        }}
      />{" "}
      <button onClick={() => setCallback(() => callback1)}>Use Callback 1</button>{" "}
      <button onClick={() => setCallback(() => callback2)}>Use Callback 2</button>
    </div>
  );
}

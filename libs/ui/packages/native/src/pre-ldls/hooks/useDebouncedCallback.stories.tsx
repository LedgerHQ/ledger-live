import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useDebouncedCallback } from ".";
import { expect, jest } from "@storybook/jest";
import { within, userEvent } from "@storybook/testing-library";

const callback1 = jest.fn();
const callback2 = jest.fn();

const meta: Meta<typeof Template> = {
  component: Template,
  title: "PreLdls/Hooks/useDebouncedCallback",
  tags: ["!autodocs"],
  args: {
    delay: 1000,
    callback1,
    callback2,
  },
};
export default meta;

type TemplateProps = {
  delay: number;
  callback1: typeof jest.fn;
  callback2: typeof jest.fn;
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
        onChange={(event) => {
          const value = event.target.value;
          setValue(value);
          debouncedCallback?.(value);
        }}
      />
      <button onClick={() => setCallback(() => callback1)}>Use Callback 1</button>
      <button onClick={() => setCallback(() => callback2)}>Use Callback 2</button>
    </div>
  );
}

export const Default: StoryObj<typeof Template> = {};

export const WithInteraction: StoryObj<typeof Template> = {
  args: {},
  controls: { expanded: true },

  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "Write something");
    await expect(input).toHaveValue("Write something");
  },
};

import { type Meta, type StoryObj } from "@storybook/react";
import { Search } from "./Search";
import { expect } from "@storybook/jest";
import { within, userEvent } from "@storybook/testing-library";

const onDebouncedChange = () => {};
const onChange = () => {};

const meta: Meta<typeof Search> = {
  component: Search,
  title: "PreLdls/Components/Search",
  tags: ["autodocs"],
  args: {
    debounceTime: 500,
    placeholder: "Search",
    onDebouncedChange,
    onChange,
  },
};
export default meta;

type Story = StoryObj<typeof Search>;

export const Default: Story = {};

// Interaction Testing
export const WithInteraction: Story = {
  args: {},
  parameters: { controls: { expanded: true } },

  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "Write something");
    await expect(input).toHaveValue("Write something");
  },
};

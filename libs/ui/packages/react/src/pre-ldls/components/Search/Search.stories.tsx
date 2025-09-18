import { type Meta, type StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { Search } from "./Search";

const onDebouncedChange = fn();
const onChange = fn();

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
  args: {
    debounceTime: 100,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("textbox");

    await userEvent.type(search, "Write something");
    expect(search).toHaveValue("Write something");
    expect(onChange).toHaveBeenCalledTimes("Write something".length);
    expect(onDebouncedChange).not.toHaveBeenCalled();
    await waitFor(() => expect(onDebouncedChange).toHaveBeenCalledTimes(1), { timeout: 200 });
    expect(onDebouncedChange).toHaveBeenCalledWith("Write something", "");

    await userEvent.clear(search);
    await userEvent.type(search, "Write something else");
    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onDebouncedChange).toHaveBeenCalledTimes(2), { timeout: 200 });
    expect(onDebouncedChange).toHaveBeenCalledWith("Write something else", "Write something");
  },
};

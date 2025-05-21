import type { Meta, StoryObj } from "@storybook/react";
import { Address } from "./Address";
import { expect, within } from "@storybook/test";

const meta: Meta<typeof Address> = {
  component: Address,
  title: "PreLdls/Components/Address",
  tags: ["autodocs"],
  args: { address: "n4A9...Zgty", cryptoId: "bitcoin", ticker: "BTC" },
};
export default meta;

type Story = StoryObj<typeof Address>;

export const Default: Story = {};

export const TestAddress: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("n4A9...Zgty");
    const icon = canvas.queryByRole("img");

    await expect(name).toBeInTheDocument();
    await expect(icon).not.toBeInTheDocument();
  },
};

export const TestAddressWithIcon: Story = {
  args: { showIcon: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const name = canvas.getByText("n4A9...Zgty");
    const icon = canvas.getByRole("img");

    await expect(name).toBeInTheDocument();
    await expect(icon).toBeInTheDocument();
  },
};

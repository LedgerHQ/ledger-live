import { SelectAccount } from "./SelectAccount";
import { expect, within } from "@storybook/test";

export default {
  component: SelectAccount,
  title: "SelectAccount",
  tags: ["autodocs"],
  args: {
    detailedAccounts: [
      {
        name: "bitcoin",
        id: "1",
        balance: "0.00031918 BTC",
        fiatValue: "$32.88",
        address: "bc1qp...2pkdr",
        protocol: "native segwit",
        cryptoId: "bitcoin",
        ticker: "BTC",
      },
      {
        name: "ethereum",
        id: "2",
        balance: "0.0436687 ETH",
        fiatValue: "$111.43",
        address: "0x10a...3Ccc1",
        cryptoId: "ethereum",
        ticker: "ETH",
      },
    ],
    accounts: [],
    onAccountSelected: () => {},
    source: "source",
    flow: "flow",
  },
};

export const SelectAccountStory = {
  title: "Test/Placeholder",
};

export const RenderAccounts = {
  // TODO i think this has to be one at a time to assert the existence of the Native Segwit label (otherwise how do you differentiate the rows?)
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bitcoin = canvas.getByText(/bitcoin/i);
    const ethereum = canvas.getByText(/ethereum/i);

    await expect(bitcoin).toBeInTheDocument();
    await expect(ethereum).toBeInTheDocument();
  },
};

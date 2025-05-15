import { SelectAccountFlow } from ".";

export default {
  component: SelectAccountFlow,
  title: "SelectAccountFlow",
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
    currencies: [],
    accounts: [],
    onAccountSelected: () => {},
    source: "source",
    flow: "flow",
  },
};

export const SelectAccountFlowStory = {
  title: "Test/Placeholder",
};

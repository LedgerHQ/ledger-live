import { currency } from "../define";

export const internet_computer = currency({
  type: "CryptoCurrency",
  id: "internet_computer",
  coinType: 223,
  name: "Internet Computer",
  managerAppName: "InternetComputer",
  ticker: "ICP",
  scheme: "internet_computer",
  color: "#e1effa",
  family: "internet_computer",
  units: [
    {
      name: "ICP",
      code: "ICP",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://dashboard.internetcomputer.org/transaction/$hash",
      address: "https://dashboard.internetcomputer.org/account/$address",
    },
  ],
});

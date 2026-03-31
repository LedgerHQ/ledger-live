import { currency } from "../define";

export const iov = currency({
  type: "CryptoCurrency",
  id: "iov",
  coinType: 234,
  name: "IOV",
  managerAppName: "IOV",
  ticker: "IOV",
  scheme: "iov",
  color: "#000",
  family: "iov",
  units: [
    {
      name: "IOV",
      code: "IOV",
      magnitude: 6,
    },
  ],
  explorerViews: [],
});

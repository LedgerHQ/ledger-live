import { currency } from "../define";

export const digibyte = currency({
  type: "CryptoCurrency",
  id: "digibyte",
  coinType: 20,
  name: "DigiByte",
  managerAppName: "Digibyte",
  ticker: "DGB",
  scheme: "digibyte",
  color: "#0066cc",
  family: "bitcoin",
  supportsSegwit: true,
  supportsNativeSegwit: true,
  blockAvgTime: 60,
  bitcoinLikeInfo: {
    P2PKH: 30,
    P2SH: 63,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "digibyte",
      code: "DGB",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://digiexplorer.info/tx/$hash",
      address: "https://digiexplorer.info/address/$address",
    },
  ],
  explorerId: "dgb",
});

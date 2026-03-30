import { currency } from "../define";

export const stratis = currency({
  terminated: {
    link: "https://support.ledger.com/",
  },
  type: "CryptoCurrency",
  id: "stratis",
  coinType: 105,
  name: "Stratis",
  managerAppName: "Stratis",
  ticker: "STRAT",
  scheme: "stratis",
  color: "#1382c6",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 63,
    P2SH: 125,
    XPUBVersion: 76071454,
  },
  units: [
    {
      name: "stratis",
      code: "STRAT",
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
      tx: "https://chainz.cryptoid.info/strat/tx.dws?$hash.htm",
      address: "https://chainz.cryptoid.info/strat/address.dws?$address.htm",
    },
  ],
  explorerId: "strat",
});

import { currency } from "../define";

export const clubcoin = currency({
  terminated: {
    link: "https://support.ledger.com/",
  },
  type: "CryptoCurrency",
  id: "clubcoin",
  coinType: 79,
  name: "Clubcoin",
  managerAppName: "Clubcoin",
  ticker: "CLUB",
  scheme: "club",
  color: "#000000",
  family: "bitcoin",
  blockAvgTime: 140,
  bitcoinLikeInfo: {
    P2PKH: 28,
    P2SH: 85,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "club",
      code: "CLUB",
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
      tx: "https://chainz.cryptoid.info/club/tx.dws?$hash.htm",
    },
  ],
  explorerId: "club",
});

import coininfo from "coininfo";
import { Currency, ICrypto } from "./types";
import * as crypto from "./index";

export default function cryptoFactory(currency: Currency): ICrypto {
  let res: ICrypto;
  switch (currency) {
    case "bitcoin": {
      const network = coininfo.bitcoin.main.toBitcoinJS();
      res = new crypto.Bitcoin({ network });
      break;
    }
    case "bitcoin_cash": {
      const network = coininfo.bitcoincash.main.toBitcoinJS();
      res = new crypto.BitcoinCash({ network });
      break;
    }
    case "litecoin": {
      const network = coininfo.litecoin.main.toBitcoinJS();
      res = new crypto.Litecoin({ network });
      break;
    }
    case "dash": {
      const network = coininfo.dash.main.toBitcoinJS();
      res = new crypto.Dash({ network });
      break;
    }
    case "qtum": {
      const network = coininfo.qtum.main.toBitcoinJS();
      res = new crypto.Qtum({ network });
      break;
    }
    case "zcash": {
      const network = coininfo.zcash.main.toBitcoinJS();
      res = new crypto.Zec({ network });
      break;
    }
    case "bitcoin_gold": {
      const network = coininfo["bitcoin gold"].main.toBitcoinJS();
      res = new crypto.BitcoinGold({ network });
      break;
    }
    case "dogecoin": {
      const network = coininfo.dogecoin.main.toBitcoinJS();
      res = new crypto.Doge({ network });
      break;
    }
    case "digibyte": {
      const network = coininfo.digibyte.main.toBitcoinJS();
      res = new crypto.Digibyte({ network });
      break;
    }
    case "komodo": {
      const network = coininfo.bitcoin.main.toBitcoinJS();
      res = new crypto.Komodo({ network });
      break;
    }
    case "pivx": {
      const network = coininfo.bitcoin.main.toBitcoinJS();
      res = new crypto.Pivx({ network });
      break;
    }
    case "zencash": {
      const network = coininfo.zcash.main.toBitcoinJS();
      res = new crypto.Zen({ network });
      break;
    }
    case "vertcoin": {
      const network = coininfo.vertcoin.main.toBitcoinJS();
      res = new crypto.Vertcoin({ network });
      break;
    }
    case "peercoin": {
      const network = coininfo.peercoin.main.toBitcoinJS();
      res = new crypto.Peercoin({ network });
      break;
    }
    case "viacoin": {
      const network = coininfo.viacoin.main.toBitcoinJS();
      res = new crypto.ViaCoin({ network });
      break;
    }
    case "stealthcoin": {
      const network = coininfo.bitcoin.main.toBitcoinJS();
      res = new crypto.Stealth({ network });
      break;
    }
    case "bitcoin_testnet": {
      const network = coininfo.bitcoin.test.toBitcoinJS();
      res = new crypto.Bitcoin({ network });
      break;
    }
    case "decred": {
      const network = coininfo.decred.main.toBitcoinJS();
      res = new crypto.Decred({ network });
      break;
    }
    default: {
      throw new Error(`Currency ${currency} doesn't exist!`);
    }
  }
  return res;
}
// TODO: Currently, all bitcoin currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies

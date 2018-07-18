//@flow
import type { FiatCurrency } from "../types";
// inspired by https://github.com/smirzaei/currency-formatter/blob/master/currencies.json

function fiat(name, ticker, defaultSymbol, defaultMagnitude): FiatCurrency {
  // for now, we only create one unit, in the future we will allow more
  return {
    ticker,
    name,
    units: [
      {
        code: ticker, // for now, code is the ticker (when formatting currencies)
        name,
        symbol: defaultSymbol,
        magnitude: defaultMagnitude,
        showAllDigits: true
      }
    ]
  };
}

const byTicker: { [key: string]: FiatCurrency } = {
  //AED: fiat("Emirati Dirham", "AED", "د.إ.", 2),
  AUD: fiat("Australian Dollar", "AUD", "$", 2),
  //BGN: fiat("Bulgarian lev", "BGN", "лв.", 2),
  //BHD: fiat("Bahraini Dinar", "BHD", "د.ب.", 3),
  BRL: fiat("Brazilian real", "BRL", "R$", 2),
  CAD: fiat("Canadian Dollar", "CAD", "$", 2),
  //CHF: fiat("Swiss Franc", "CHF", "CHF", 2),
  //CLP: fiat("Chilean Peso", "CLP", "$", 2),
  //CNY: fiat("Yuan or chinese renminbi", "CNY", "¥", 2),
  //CRC: fiat("Costa Rican colón", "CRC", "₡", 2),
  CZK: fiat("Czech koruna", "CZK", "Kč", 2),
  //DKK: fiat("Danish krone", "DKK", "kr.", 2),
  EUR: fiat("Euro", "EUR", "€", 2),
  GBP: fiat("British Pound", "GBP", "£", 2),
  //GHS: fiat("Ghanaian Cedi", "GHS", "₵", 2),
  HKD: fiat("Hong Kong dollar", "HKD", "HK$", 2),
  //HRK: fiat("Croatian kuna", "HRK", "kn", 2),
  //HUF: fiat("Hungarian forint", "HUF", "Ft", 2),
  //IDR: fiat("Indonesian Rupiah", "IDR", "Rp", 0),
  //ILS: fiat("Israeli Shekel", "ILS", "₪", 2),
  //INR: fiat("Indian Rupee", "INR", "₹", 2),
  //IRR: fiat("Iranian Rial", "IRR", "﷼", 2),
  JPY: fiat("Japanese yen", "JPY", "¥", 0),
  //KES: fiat("Kenyan Shilling", "KES", "S", 2),
  //KHR: fiat("Cambodian Riel", "KHR", "៛", 0),
  KRW: fiat("South Korean won", "KRW", "₩", 0),
  //MUR: fiat("Mauritian rupee", "MUR", "₨", 2),
  MXN: fiat("Mexico Peso", "MXN", "$", 2),
  MYR: fiat("Malaysian Ringgit", "MYR", "RM", 2),
  NGN: fiat("Nigerian Naira", "NGN", "₦", 2),
  //NOK: fiat("Norwegian krone", "NOK", "kr", 2),
  NZD: fiat("New Zealand Dollar", "NZD", "$", 2),
  //PHP: fiat("Philippine Peso", "PHP", "₱", 2),
  //PKR: fiat("Pakistani Rupee", "PKR", "₨", 2),
  PLN: fiat("Polish złoty", "PLN", "zł", 2),
  //RON: fiat("Romanian leu", "RON", "lei", 2),
  RUB: fiat("Russian Rouble", "RUB", "₽", 2),
  //SEK: fiat("Swedish krona", "SEK", "kr", 2),
  SGD: fiat("Singapore Dollar", "SGD", "$", 2),
  //THB: fiat("Thai Baht", "THB", "฿", 2),
  TRY: fiat("Turkish Lira", "TRY", "TL", 2),
  //TZS: fiat("Tanzanian Shilling", "TZS", "TSh", 2),
  UAH: fiat("Ukrainian Hryvnia", "UAH", "₴", 2),
  //UGX: fiat("Ugandan Shilling", "UGX", "USh", 2),
  USD: fiat("US Dollar", "USD", "$", 2),
  //VEF: fiat("Venezuelan bolivar", "VEF", "Bs. F.", 2),
  //VND: fiat("Vietnamese Dong", "VND", "₫", 1),
  //VUV: fiat("Ni-Vanuatu Vatu", "VUV", "VT", 0),
  ZAR: fiat("South African Rand", "ZAR", "R", 2)
};

export function hasFiatCurrencyTicker(ticker: string): boolean {
  return ticker in byTicker;
}

export function findFiatCurrencyByTicker(ticker: string): ?FiatCurrency {
  return byTicker[ticker];
}

export function getFiatCurrencyByTicker(ticker: string): FiatCurrency {
  const cur = findFiatCurrencyByTicker(ticker);
  if (!cur) {
    throw new Error(`fiat currency "${ticker}" not found`);
  }
  return cur;
}

const list = Object.keys(byTicker).map(k => byTicker[k]);

export function listFiatCurrencies(): FiatCurrency[] {
  return list;
}

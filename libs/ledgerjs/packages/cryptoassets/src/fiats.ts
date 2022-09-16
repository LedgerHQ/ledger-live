import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
// inspired by https://github.com/smirzaei/currency-formatter/blob/master/currencies.json

function fiat(name, ticker, defaultSymbol, defaultMagnitude): FiatCurrency {
  // for now, we only create one unit, in the future we will allow more
  return {
    type: "FiatCurrency",
    ticker,
    name,
    symbol: defaultSymbol,
    units: [
      {
        code: defaultSymbol,
        name,
        magnitude: defaultMagnitude,
        showAllDigits: true,
        prefixCode: true,
      },
    ],
  };
}

const byTicker: Record<string, FiatCurrency> = {
  AED: fiat("Emirati Dirham", "AED", "د.إ.", 2),
  AUD: fiat("Australian Dollar", "AUD", "AU$", 2),
  BGN: fiat("Bulgarian Lev", "BGN", "лв.", 2),
  BHD: fiat("Bahraini Dinar", "BHD", "د.ب.", 3),
  BRL: fiat("Brazilian Real", "BRL", "R$", 2),
  CAD: fiat("Canadian Dollar", "CAD", "CA$", 2),
  CHF: fiat("Swiss Franc", "CHF", "CHF", 2),
  CLP: fiat("Chilean Peso", "CLP", "CLP$", 2),
  CNY: fiat("Yuan or Chinese Renminbi", "CNY", "¥", 2),
  CRC: fiat("Costa Rican Colón", "CRC", "₡", 2),
  CZK: fiat("Czech Koruna", "CZK", "Kč", 2),
  DKK: fiat("Danish Krone", "DKK", "kr.", 2),
  EUR: fiat("Euro", "EUR", "€", 2),
  GBP: fiat("British Pound", "GBP", "£", 2),
  GHS: fiat("Ghanaian Cedi", "GHS", "₵", 2),
  HKD: fiat("Hong Kong Dollar", "HKD", "HK$", 2),
  HRK: fiat("Croatian Kuna", "HRK", "kn", 2),
  HUF: fiat("Hungarian Forint", "HUF", "Ft", 2),
  IDR: fiat("Indonesian Rupiah", "IDR", "Rp", 0),
  ILS: fiat("Israeli Shekel", "ILS", "₪", 2),
  INR: fiat("Indian Rupee", "INR", "₹", 2),
  IRR: fiat("Iranian Rial", "IRR", "﷼", 2),
  JPY: fiat("Japanese Yen", "JPY", "¥", 0),
  KES: fiat("Kenyan Shilling", "KES", "S", 2),
  KHR: fiat("Cambodian Riel", "KHR", "៛", 0),
  KRW: fiat("South Korean Won", "KRW", "₩", 0),
  MUR: fiat("Mauritian Rupee", "MUR", "₨", 2),
  MXN: fiat("Mexico Peso", "MXN", "Mex$", 2),
  MYR: fiat("Malaysian Ringgit", "MYR", "RM", 2),
  NGN: fiat("Nigerian Naira", "NGN", "₦", 2),
  NOK: fiat("Norwegian Krone", "NOK", "kr", 2),
  NZD: fiat("New Zealand Dollar", "NZD", "NZ$", 2),
  PHP: fiat("Philippine Peso", "PHP", "₱", 2),
  PKR: fiat("Pakistani Rupee", "PKR", "₨", 2),
  PLN: fiat("Polish Złoty", "PLN", "zł", 2),
  RON: fiat("Romanian Leu", "RON", "lei", 2),
  RUB: fiat("Russian Rouble", "RUB", "₽", 2),
  SEK: fiat("Swedish Krona", "SEK", "kr", 2),
  SGD: fiat("Singapore Dollar", "SGD", "S$", 2),
  THB: fiat("Thai Baht", "THB", "฿", 2),
  TRY: fiat("Turkish Lira", "TRY", "TL", 2),
  TZS: fiat("Tanzanian Shilling", "TZS", "TSh", 2),
  UAH: fiat("Ukrainian Hryvnia", "UAH", "₴", 2),
  UGX: fiat("Ugandan Shilling", "UGX", "USh", 2),
  USD: fiat("US Dollar", "USD", "$", 2),
  VES: fiat("Venezuelan Bolivar", "VES", "Bs. S.", 2),
  VND: fiat("Vietnamese Dong", "VND", "₫", 1),
  VUV: fiat("Ni-Vanuatu Vatu", "VUV", "VT", 0),
  ZAR: fiat("South African Rand", "ZAR", "R", 2),
};
const list = Object.keys(byTicker).map((k) => byTicker[k]);

/**
 *
 * @param {*} ticker
 */
export function hasFiatCurrencyTicker(ticker: string): boolean {
  return ticker in byTicker;
}

/**
 *
 * @param {*} ticker
 */
export function findFiatCurrencyByTicker(
  ticker: string
): FiatCurrency | null | undefined {
  return byTicker[ticker];
}

/**
 *
 * @param {*} ticker
 */
export function getFiatCurrencyByTicker(ticker: string): FiatCurrency {
  const cur = findFiatCurrencyByTicker(ticker);

  if (!cur) {
    throw new Error(`fiat currency "${ticker}" not found`);
  }

  return cur;
}

/**
 *
 */
export function listFiatCurrencies(): FiatCurrency[] {
  return list;
}

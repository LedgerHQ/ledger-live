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
  AFN: fiat("Afghan Afghani", "AFN", "؋", 2),
  ALL: fiat("Albanian Lek", "ALL", "Lek", 2),
  AMD: fiat("Armenian Dram", "AMD", "֏", 2),
  ANG: fiat("Netherlands Antillean Guilder", "ANG", "ƒ", 2),
  AOA: fiat("Angolan Kwanza", "AOA", "Kz", 2),
  ARS: fiat("Argentine Peso", "ARS", "$", 2),
  AUD: fiat("Australian Dollar", "AUD", "AU$", 2),
  AWG: fiat("Aruban Florin", "AWG", "ƒ", 2),
  AZN: fiat("Azerbaijani Manat", "AZN", "₼", 2),
  BAM: fiat("Bosnia-Herzegovina Convertible Mark", "BAM", "КМ", 2),
  BBD: fiat("Barbadian Dollar", "BBD", "$", 2),
  BDT: fiat("Bangladeshi Taka", "BDT", "৳", 0),
  BGN: fiat("Bulgarian Lev", "BGN", "лв.", 2),
  BHD: fiat("Bahraini Dinar", "BHD", "د.ب.", 3),
  BIF: fiat("Burundian Franc", "BIF", "FBu", 0),
  BMD: fiat("Bermudian Dollar", "BMD", "$", 2),
  BND: fiat("Brunei Dollar", "BND", "$", 0),
  BOB: fiat("Bolivian Boliviano", "BOB", "Bs", 2),
  BRL: fiat("Brazilian Real", "BRL", "R$", 2),
  BSD: fiat("Bahamian Dollar", "BSD", "$", 2),
  BTC: fiat("Bitcoin", "BTC", "Ƀ", 8),
  BTN: fiat("Bhutanese Ngultrum", "BTN", "Nu.", 1),
  BWP: fiat("Botswana Pula", "BWP", "P", 2),
  BYN: fiat("Belarusian Ruble", "BYN", "р.", 2),
  BYR: fiat("Belarusian Ruble (pre-2016)", "BYR", "р.", 2),
  BZD: fiat("Belize Dollar", "BZD", "BZ$", 2),
  CAD: fiat("Canadian Dollar", "CAD", "CA$", 2),
  CDF: fiat("Congolese Franc", "CDF", "FC", 2),
  CHF: fiat("Swiss Franc", "CHF", "CHF", 2),
  CLP: fiat("Chilean Peso", "CLP", "CLP$", 0),
  CNY: fiat("Chinese Yuan Renminbi", "CNY", "¥", 2),
  COP: fiat("Colombian Peso", "COP", "$", 2),
  CRC: fiat("Costa Rican Colón", "CRC", "₡", 2),
  CUC: fiat("Cuban Convertible Peso", "CUC", "CUC", 2),
  CUP: fiat("Cuban Peso", "CUP", "$MN", 2),
  CVE: fiat("Cape Verdean Escudo", "CVE", "$", 2),
  CZK: fiat("Czech Koruna", "CZK", "Kč", 2),
  DJF: fiat("Djiboutian Franc", "DJF", "Fdj", 0),
  DKK: fiat("Danish Krone", "DKK", "kr.", 2),
  DOP: fiat("Dominican Peso", "DOP", "RD$", 2),
  DZD: fiat("Algerian Dinar", "DZD", "د.ج.‏", 2),
  EGP: fiat("Egyptian Pound", "EGP", "ج.م.‏", 2),
  ERN: fiat("Eritrean Nakfa", "ERN", "Nfk", 2),
  ETB: fiat("Ethiopian Birr", "ETB", "ETB", 2),
  EUR: fiat("Euro", "EUR", "€", 2),
  FJD: fiat("Fijian Dollar", "FJD", "$", 2),
  FKP: fiat("Falkland Islands Pound", "FKP", "£", 2),
  GBP: fiat("British Pound", "GBP", "£", 2),
  GEL: fiat("Georgian Lari", "GEL", "GEL", 2),
  GHS: fiat("Ghanaian Cedi", "GHS", "₵", 2),
  GIP: fiat("Gibraltar Pound", "GIP", "£", 2),
  GMD: fiat("Gambian Dalasi", "GMD", "D", 2),
  GNF: fiat("Guinean Franc", "GNF", "FG", 0),
  GTQ: fiat("Guatemalan Quetzal", "GTQ", "Q", 2),
  GYD: fiat("Guyanese Dollar", "GYD", "$", 2),
  HKD: fiat("Hong Kong Dollar", "HKD", "HK$", 2),
  HNL: fiat("Honduran Lempira", "HNL", "L.", 2),
  HRK: fiat("Croatian Kuna", "HRK", "kn", 2),
  HTG: fiat("Haitian Gourde", "HTG", "G", 2),
  HUF: fiat("Hungarian Forint", "HUF", "Ft", 2),
  IDR: fiat("Indonesian Rupiah", "IDR", "Rp", 0),
  ILS: fiat("Israeli Shekel", "ILS", "₪", 2),
  INR: fiat("Indian Rupee", "INR", "₹", 2),
  IQD: fiat("Iraqi Dinar", "IQD", "د.ع.‏", 2),
  IRR: fiat("Iranian Rial", "IRR", "﷼", 2),
  ISK: fiat("Iceland Krona", "ISK", "kr.", 0),
  JMD: fiat("Jamaican Dollar", "JMD", "J$", 2),
  JOD: fiat("Jordanian Dinar", "JOD", "د.ا.‏", 3),
  JPY: fiat("Japanese Yen", "JPY", "¥", 0),
  KES: fiat("Kenyan Shilling", "KES", "KSh", 2),
  KGS: fiat("Kyrgyzstani Som", "KGS", "сом", 2),
  KHR: fiat("Cambodian Riel", "KHR", "៛", 0),
  KMF: fiat("Comorian Franc", "KMF", "CF", 2),
  KPW: fiat("North Korean Won", "KPW", "₩", 0),
  KRW: fiat("South Korean Won", "KRW", "₩", 0),
  KWD: fiat("Kuwaiti Dinar", "KWD", "د.ك.‏", 3),
  KYD: fiat("Cayman Islands Dollar", "KYD", "$", 2),
  KZT: fiat("Kazakhstani Tenge", "KZT", "₸", 2),
  LAK: fiat("Lao Kip", "LAK", "₭", 0),
  LBP: fiat("Lebanese Pound", "LBP", "ل.ل.‏", 2),
  LKR: fiat("Sri Lankan Rupee", "LKR", "₨", 0),
  LRD: fiat("Liberian Dollar", "LRD", "$", 2),
  LSL: fiat("Lesotho Loti", "LSL", "M", 2),
  LYD: fiat("Libyan Dinar", "LYD", "د.ل.‏", 3),
  MAD: fiat("Moroccan Dirham", "MAD", "د.م.‏", 2),
  MDL: fiat("Moldovan Leu", "MDL", "lei", 2),
  MGA: fiat("Malagasy Ariary", "MGA", "Ar", 0),
  MKD: fiat("Macedonian Denar", "MKD", "ден.", 2),
  MMK: fiat("Myanmar Kyat", "MMK", "K", 2),
  MNT: fiat("Mongolian Tugrik", "MNT", "₮", 2),
  MOP: fiat("Macanese Pataca", "MOP", "MOP$", 2),
  MRO: fiat("Mauritanian Ouguiya", "MRO", "UM", 2),
  MTL: fiat("Maltese Lira", "MTL", "₤", 2),
  MUR: fiat("Mauritian Rupee", "MUR", "₨", 2),
  MVR: fiat("Maldivian Rufiyaa", "MVR", "MVR", 1),
  MWK: fiat("Malawian Kwacha", "MWK", "MK", 2),
  MXN: fiat("Mexican Peso", "MXN", "Mex$", 2),
  MYR: fiat("Malaysian Ringgit", "MYR", "RM", 2),
  MZN: fiat("Mozambican Metical", "MZN", "MT", 0),
  NAD: fiat("Namibian Dollar", "NAD", "$", 2),
  NGN: fiat("Nigerian Naira", "NGN", "₦", 2),
  NIO: fiat("Nicaraguan Córdoba", "NIO", "C$", 2),
  NOK: fiat("Norwegian Krone", "NOK", "kr", 2),
  NPR: fiat("Nepalese Rupee", "NPR", "₨", 2),
  NZD: fiat("New Zealand Dollar", "NZD", "NZ$", 2),
  OMR: fiat("Omani Rial", "OMR", "﷼", 3),
  PAB: fiat("Panamanian Balboa", "PAB", "B/.", 2),
  PEN: fiat("Peruvian Sol", "PEN", "S/.", 2),
  PGK: fiat("Papua New Guinean Kina", "PGK", "K", 2),
  PHP: fiat("Philippine Peso", "PHP", "₱", 2),
  PKR: fiat("Pakistani Rupee", "PKR", "₨", 2),
  PLN: fiat("Polish Złoty", "PLN", "zł", 2),
  PYG: fiat("Paraguayan Guarani", "PYG", "₲", 2),
  QAR: fiat("Qatari Riyal", "QAR", "﷼", 2),
  RON: fiat("Romanian Leu", "RON", "L", 2),
  RSD: fiat("Serbian Dinar", "RSD", "Дин.", 2),
  RUB: fiat("Russian Rouble", "RUB", "₽", 2),
  RWF: fiat("Rwandan Franc", "RWF", "RWF", 2),
  SAR: fiat("Saudi Riyal", "SAR", "﷼", 2),
  SBD: fiat("Solomon Islands Dollar", "SBD", "$", 2),
  SCR: fiat("Seychellois Rupee", "SCR", "₨", 2),
  SDD: fiat("Sudanese Dinar (1992-2007)", "SDD", "LSd", 2),
  SDG: fiat("Sudanese Pound", "SDG", "£‏", 2),
  SEK: fiat("Swedish Krona", "SEK", "kr", 2),
  SGD: fiat("Singapore Dollar", "SGD", "S$", 2),
  SHP: fiat("Saint Helena Pound", "SHP", "£", 2),
  SLL: fiat("Sierra Leonean Leone", "SLL", "Le", 2),
  SOS: fiat("Somali Shilling", "SOS", "S", 2),
  SRD: fiat("Surinamese Dollar", "SRD", "$", 2),
  STD: fiat("São Tomé and Príncipe Dobra", "STD", "Db", 2),
  SVC: fiat("Salvadoran Colón", "SVC", "₡", 2),
  SYP: fiat("Syrian Pound", "SYP", "£", 2),
  SZL: fiat("Swazi Lilangeni", "SZL", "E", 2),
  THB: fiat("Thai Baht", "THB", "฿", 2),
  TJS: fiat("Tajikistani Somoni", "TJS", "TJS", 2),
  TMT: fiat("Turkmenistani Manat", "TMT", "m", 0),
  TND: fiat("Tunisian Dinar", "TND", "د.ت.‏", 3),
  TOP: fiat("Tongan Pa'anga", "TOP", "T$", 2),
  TRY: fiat("Turkish Lira", "TRY", "₺", 2),
  TTD: fiat("Trinidad and Tobago Dollar", "TTD", "TT$", 2),
  TVD: fiat("Tuvaluan Dollar", "TVD", "$", 2),
  TWD: fiat("New Taiwan Dollar", "TWD", "NT$", 2),
  TZS: fiat("Tanzanian Shilling", "TZS", "TSh", 2),
  UAH: fiat("Ukrainian Hryvnia", "UAH", "₴", 2),
  UGX: fiat("Ugandan Shilling", "UGX", "USh", 2),
  USD: fiat("US Dollar", "USD", "$", 2),
  UYU: fiat("Uruguayan Peso", "UYU", "$U", 2),
  UZS: fiat("Uzbekistani Som", "UZS", "сўм", 2),
  VEB: fiat("Venezuelan Bolívar (1871–2008)", "VEB", "Bs.", 2),
  VEF: fiat("Venezuelan Bolívar (2008–2018)", "VEF", "Bs. F.", 2),
  VND: fiat("Vietnamese Dong", "VND", "₫", 0),
  VUV: fiat("Vanuatu Vatu", "VUV", "VT", 0),
  WON: fiat("North Korean Won", "WON", "₩", 2),
  WST: fiat("Samoan Tala", "WST", "WS$", 2),
  XAF: fiat("Central African CFA Franc", "XAF", "F", 2),
  XBT: fiat("Bitcoin", "XBT", "Ƀ", 2),
  XCD: fiat("East Caribbean Dollar", "XCD", "$", 2),
  XOF: fiat("West African CFA Franc", "XOF", "F", 2),
  XPF: fiat("CFP Franc", "XPF", "F", 2),
  YER: fiat("Yemeni Rial", "YER", "﷼", 2),
  ZAR: fiat("South African Rand", "ZAR", "R", 2),
  ZMW: fiat("Zambian Kwacha", "ZMW", "ZK", 2),
};
const list = Object.keys(byTicker).map(k => byTicker[k]);

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
export function findFiatCurrencyByTicker(ticker: string): FiatCurrency | null | undefined {
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

const NativeLocale = {
  decimalStyle: (number: any) => `${number}`,
  numberFromDecimalString: (number: any) => parseFloat(number),
  dateFormat: (date: any, _1: any, _2: any) => date.toString(),
  currencyCode: "USD",
  currencySymbol: "$",
  decimalSeparator: ".",
  groupingSeparator: ",",
  localeDateFormats: {
    short: "M/d/yy",
    long: "MMMM d, y",
    medium: "MMM d, y",
    full: "EEEE, MMMM d, y",
  },
  localeIdentifier: "en_US",
  preferredLanguages: ["en"],
  quotationBeginDelimiterKey: "“",
  quotationEndDelimiterKey: "”",
};
const m = {
  constants() {
    return NativeLocale;
  },

  numberFromDecimalString(number: string) {
    return NativeLocale.numberFromDecimalString(number);
  },

  decimalStyle(number: number) {
    return NativeLocale.decimalStyle(number);
  },

  validateDateFormatStyle(style: string) {
    const valid = ["full", "long", "medium", "short", "none"];
    return valid.indexOf(style) >= 0;
  },

  dateFormat(date: any, dateStyle: string, timeStyle: string) {
    return NativeLocale.dateFormat(date, dateStyle, timeStyle);
  },
};
export default m;

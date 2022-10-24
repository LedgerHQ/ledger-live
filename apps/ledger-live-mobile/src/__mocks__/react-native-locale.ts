const NativeLocale = {
  decimalStyle: (number: string | number) => `${number}`,
  numberFromDecimalString: (number: string) => parseFloat(number),
  dateFormat: (date: Date, _1: string, _2: string) => date.toString(),
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

  dateFormat(date: Date, dateStyle: string, timeStyle: string) {
    return NativeLocale.dateFormat(date, dateStyle, timeStyle);
  },
};
export default m;

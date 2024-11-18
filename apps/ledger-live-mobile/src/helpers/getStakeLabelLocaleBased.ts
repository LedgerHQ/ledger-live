import RNLocalize from "react-native-localize";

export const getStakeLabelLocaleBased = () =>
  RNLocalize.getCountry() === "GB" ? "account.yield" : "account.earn";

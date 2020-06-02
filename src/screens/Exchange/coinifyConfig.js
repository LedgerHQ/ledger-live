// @flow
import Config from "react-native-config";

const config = {
  sandbox: {
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: 104,
  },
  production: {
    url: "https://trade-ui.coinify.com/widget",
    partnerId: 119,
  },
};

export const getConfig = () =>
  Config.COINIFY_SANDBOX ? config.sandbox : config.production;

// @flow

const config = {
  developpement: {
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: 104,
  },
  production: {
    url: "https://trade-ui.coinify.com/widget",
    partnerId: 119,
  },
};

export const getConfig = (env: string) => config[env];

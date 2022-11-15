import { CosmosOperationMode } from "../types";

class Crypto {
  lcd: string;
  default_gas = 100000;
  min_gasprice = 0.0025;
  gas: {
    [Key in CosmosOperationMode]: number;
  } = {
    // refer to https://github.com/chainapsis/keplr-wallet/blob/master/packages/stores/src/account/cosmos.ts#L113 for the gas fees
    send: 80000,
    delegate: 250000,
    undelegate: 250000,
    redelegate: 250000,
    claimReward: 140000,
    claimRewardCompound: 400000,
  };
  constructor(currency: string) {
    if (currency === "cosmos") {
      this.lcd = "https://cosmoshub4.coin.ledger.com";
      this.min_gasprice = 0.025;
    } else if (currency === "osmosis") {
      this.lcd = "https://osmosis.coin.ledger.com/node";
      this.gas = {
        send: 100000,
        delegate: 300000,
        undelegate: 350000,
        redelegate: 550000,
        claimReward: 300000,
        claimRewardCompound: 400000,
      };
    } else if (currency === "juno") {
      this.lcd = "https://lcd-juno.itastakers.com";
    } else {
      throw new Error(`${currency} is not supported`);
    }
  }
}

export default Crypto;

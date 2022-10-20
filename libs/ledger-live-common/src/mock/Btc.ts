import Btc, { AddressFormat } from "@ledgerhq/hw-app-btc";
import { CreateTransactionArg } from "@ledgerhq/hw-app-btc/createTransaction";
import Transport from "@ledgerhq/hw-transport";
import hash from "object-hash";

class MockBtc extends Btc {
  constructor() {
    super({ transport: new Transport() });
  }

  // eslint-disable-next-line class-methods-use-this
  async getWalletPublicKey(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    opts: { verify?: boolean; format?: AddressFormat }
  ) {
    switch (path) {
      case "44'/0'":
        return {
          publicKey:
            "04c621f37493d99f39ca12fb02ba7fe1687b1650b875dcb6733f386a98958e6556fc95dcecb6ac41af0a5296965751b1598aa475a537474bab5b316fcdc1196568",
          chainCode:
            "a45d311c31a80bf06cc38d8ed7934bd1e8a7b2d48b2868a70258a86e094bacfb",
          bitcoinAddress: "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D",
        };
        break;
      case "44'/0'/0'":
        return {
          publicKey:
            "04d52d1ad9311c5a3d542fa652fbd7d7b0be70109e329d359704d9f2946f8eb52a829c23f8b980c5f7b6c51bf446b21f3dc80c865095243c9215dbf9f3cb6403b8",
          chainCode:
            "0bd3e45edca4d8a466f523a2c4094c412d25c36d5298b2d3a29938151a8d37fe",
          bitcoinAddress: "1FHa4cuKdea21ByTngP9vz3KYDqqQe9SsA",
        };
        break;
      default:
        throw new Error("not supported");
    }
  }

  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  async createPaymentTransaction(arg: CreateTransactionArg) {
    return hash(arg);
  }
}

export default MockBtc;

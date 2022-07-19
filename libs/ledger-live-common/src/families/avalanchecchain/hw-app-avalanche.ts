import Transport from "@ledgerhq/hw-transport";
import Eth, { ledgerService as ethLedgerServices } from "@ledgerhq/hw-app-eth";

export default class Avalanche {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  async signTransaction(
    path: string,
    rawTxHex: string
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    const resolution = await ethLedgerServices.resolveTransaction(
      rawTxHex,
      {},
      {}
    );
    const eth = new Eth(this.transport);

    return await eth.signTransaction(path, rawTxHex, resolution);
  }
}

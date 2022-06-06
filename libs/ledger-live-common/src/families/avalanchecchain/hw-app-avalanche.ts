import Transport from "@ledgerhq/hw-transport";
import ledgerService from "@ledgerhq/hw-app-eth/lib/services/ledger";
import Eth from "@ledgerhq/hw-app-eth";

export default class Avalanche {
    transport: Transport;

    constructor(transport: Transport) {
        this.transport = transport;
    }

    async signTransaction(path: string, rawTxHex: string): Promise<{
        s: string;
        v: string;
        r: string;
    }> {
        const resolution = await ledgerService.resolveTransaction(rawTxHex, {}, {});
        const eth = new Eth(this.transport);

        return await eth.signTransaction(path, rawTxHex, resolution);
    };
}
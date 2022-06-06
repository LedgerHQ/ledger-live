import Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import bech32 from "bech32";
import secp256k1 from "secp256k1";

const CLA = 0x80;
const INS = {
    GET_ADDRESS: 0x02,
    GET_EXTENDED_PUBLIC_KEY: 0x03
};
const AVAX_BIP32_PREFIX = "m/44'/9000'/0'";

export default class Avalanche {
    transport: Transport;

    constructor(transport: Transport, scrambleKey = "AVAX") {
        this.transport = transport;
        transport.decorateAppAPIMethods(this, ["getAddress"], scrambleKey);
    }

    serializePath(path: Array<number>): Buffer {
        const data = Buffer.alloc(1 + path.length * 4);

        data.writeInt8(path.length, 0);
        path.forEach((segment, index) => {
            data.writeUInt32BE(segment, 1 + index * 4);
        });

        return data;
    }

    async getPublicKey(display?: boolean) {
        const bipPath = BIPPath.fromString(AVAX_BIP32_PREFIX).toPathArray();
        const data = this.serializePath(bipPath);

        const p1 = display ? 0x01 : 0x00;
        const p2 = 0x00;

        const response = await this.transport.send(CLA, INS.GET_EXTENDED_PUBLIC_KEY, p1, p2, data);

        const publicKeyLength = response[0];
        const publicKeyBuffer = response.slice(1, 1 + publicKeyLength);
        const compressedPublicKey = Buffer.from(secp256k1.publicKeyConvert(publicKeyBuffer, true));
        const publicKey = compressedPublicKey.toString("hex");

        const chainCodeOffset = 2 + publicKeyLength;
        const chainCodeLength = response[1 + publicKeyLength];
        const chainCodeBuffer = response.slice(chainCodeOffset, chainCodeOffset + chainCodeLength);
        const chainCode = chainCodeBuffer.toString("hex");

        return {
            publicKey,
            chainCode,
        };
    }

    /**
     * Get Avalanche address for the given BIP 32 path.
     * @param path a path in BIP 32 format
     * @return an object with an address
     * @example
     * avalanche.getAddress("44'/9000'/0'/0/0").then(o => o.address)
     */
    async getAddress(path: string, display?: boolean) {
        const bipPath = BIPPath.fromString(path).toPathArray();
        const buffer = this.serializePath(bipPath);

        const p1 = display ? 0x01 : 0x00;
        const p2 = 0x00;

        const result = await this.transport.send(CLA, INS.GET_ADDRESS, p1, p2, buffer);
        const address = bech32.encode("avax", bech32.toWords(result.slice(0, -2)));

        const { publicKey, chainCode } = await this.getPublicKey(display);

        return {
            address,
            publicKey,
            chainCode
        }
    }
} 
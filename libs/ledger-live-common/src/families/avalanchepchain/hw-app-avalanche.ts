import Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import bech32 from "bech32";
import secp256k1 from "secp256k1";
import { createHash } from "crypto";

const CLA = 0x80;
const INS = {
    GET_VERSION: 0x00,
    GET_ADDRESS: 0x02,
    GET_EXTENDED_PUBLIC_KEY: 0x03,
    SIGN_HASH: 0x04,
    SIGN_TRANSACTION: 0x05
};
const MAX_APDU_SIZE = 230;

export const AVAX_BIP32_PREFIX = "m/44'/9000'/0'";

export default class Avalanche {
    transport: Transport;

    constructor(transport: Transport, scrambleKey = "AVAX") {
        this.transport = transport;
        transport.decorateAppAPIMethods(this, ["getAddress", "getLedgerAppConfiguration"], scrambleKey);
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

    async getLedgerAppConfiguration(): Promise<{
        version: string,
        commit: string,
        name: string,
    }> {
        const data: Buffer = await this.transport.send(CLA, INS.GET_VERSION, 0x00, 0x00);

        const eatNBytes = (input) => {
            const out = input.slice(0, 3);
            return [out, input.slice(3)];
        };

        const eatWhile = (input, f) => {
            for (var i = 0; i < input.length; i++) {
                if (!f(input[i])) {
                    return [input.slice(0, i), input.slice(i)];
                }
            }
            return [input, ""];
        };

        const [versionData, rest1] = eatNBytes(data);
        const [commitData, rest2] = eatWhile(rest1, c => c != 0);
        const [nameData] = eatWhile(rest2.slice(1), c => c != 0);

        return {
            version: "" + versionData[0] + "." + versionData[1] + "." + versionData[2],
            commit: commitData.toString("latin1"),
            name: nameData.toString("latin1")
        };
    }

    async signTransaction(
        derivationPathPrefix: BIPPath,
        derivationPathSuffixes: Array<BIPPath>,
        txn: Buffer,
        changePath?: BIPPath
    ): Promise<{ hash: Buffer, signatures: Map<string, Buffer>; }> {

        const SIGN_TRANSACTION_SECTION_PREAMBLE = 0x00;
        const SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK = 0x01;
        const SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK_LAST = 0x81;
        const SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH = 0x02;
        const SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH_LAST = 0x82;

        const preamble = Buffer.concat([
            this.uInt8Buffer(derivationPathSuffixes.length),
            this.encodeBip32Path(derivationPathPrefix)
        ]);

        if (changePath != undefined && changePath != null) {
            const preamble_ = Buffer.concat([
                preamble,
                this.encodeBip32Path(changePath)
            ]);
            await this.transport.send(CLA, INS.SIGN_TRANSACTION, SIGN_TRANSACTION_SECTION_PREAMBLE, 0x01, preamble_);
        } else {
            await this.transport.send(CLA, INS.SIGN_TRANSACTION, SIGN_TRANSACTION_SECTION_PREAMBLE, 0x00, preamble);
        }

        let remainingData = txn.slice(0);

        let response;

        while (remainingData.length > 0) {
            const thisChunk = remainingData.slice(0, MAX_APDU_SIZE);
            remainingData = remainingData.slice(MAX_APDU_SIZE);

            response = await this.transport.send(
                CLA,
                INS.SIGN_TRANSACTION,
                remainingData.length > 0
                    ? SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK
                    : SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK_LAST,
                0x00,
                thisChunk,
            );
        }

        const responseHash = response.slice(0, 32);
        const expectedHash = Buffer.from(createHash('sha256').update(txn).digest());
        if (!responseHash.equals(expectedHash)) {
            throw "Ledger reported a hash that does not match the expected transaction hash";
        }

        return {
            hash: responseHash,
            signatures: await this.collectSignaturesFromSuffixes(
                derivationPathSuffixes,
                INS.SIGN_TRANSACTION,
                SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH,
                SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH_LAST,
            )
        };
    }

    async signHash(
        derivationPathPrefix: BIPPath,
        derivationPathSuffixes: Array<BIPPath>,
        hash: Buffer,
    ): Promise<Map<string, Buffer>> {
        if (hash.length != 32) {
            throw "Hash buffer must be 32 bytes";
        }

        const firstMessage: Buffer = Buffer.concat([
            this.uInt8Buffer(derivationPathSuffixes.length),
            hash,
            this.encodeBip32Path(derivationPathPrefix)
        ]);
        const responseHash = await this.transport.send(CLA, INS.SIGN_HASH, 0x00, 0x00, firstMessage);
        if (!responseHash.slice(0, 32).equals(hash)) {
            throw "Ledger reported a hash that does not match the input hash!";
        }

        return this.collectSignaturesFromSuffixes(derivationPathSuffixes, INS.SIGN_HASH, 0x01, 0x81);
    }

    async collectSignaturesFromSuffixes(suffixes: Array<BIPPath>, ins: number, p1NotDone: number, p1Done: number) {
        let resultMap: Map<string, Buffer> = new Map();
        for (let ix = 0; ix < suffixes.length; ix++) {
            const suffix = suffixes[ix];
            const message: Buffer = this.encodeBip32Path(suffix);
            const isLastMessage: Boolean = ix >= suffixes.length - 1;
            const signatureData = await this.transport.send(CLA, ins, isLastMessage ? p1Done : p1NotDone, 0x00, message);
            resultMap.set(suffix.toString(true), signatureData.slice(0, -2));
        };
        return resultMap;
    }

    uInt8Buffer(uint8: number): Buffer {
        let buff = Buffer.alloc(1);
        buff.writeUInt8(uint8);
        return buff;
    }

    uInt32BEBuffer(uint32: number): Buffer {
        let buff = Buffer.alloc(4);
        buff.writeUInt32BE(uint32);
        return buff;
    }

    encodeBip32Path(path: BIPPath): Buffer {
        const pathArr = path.toPathArray();
        return Buffer.concat([this.uInt8Buffer(pathArr.length)].concat(pathArr.map(this.uInt32BEBuffer)));
    }
} 
import base32 from './base32';

function convertBits(data: number[], from: number, to: number, strict: boolean = false): number[] {
    strict = strict || false;
    var accumulator = 0;
    var bits = 0;
    var result : number[] = [];
    var mask = (1 << to) - 1;
    for (var i = 0; i < data.length; i++) {
        var value = data[i];
        if (value < 0 || value >> from !== 0) {
            throw new Error(`Invalid argument: value = ${value}`);
        }

        accumulator = (accumulator << from) | value;
        bits += from;
        while (bits >= to) {
            bits -= to;
            result.push((accumulator >> bits) & mask);
        }
    }
    if (!strict) {
        if (bits > 0) {
            result.push((accumulator << (to - bits)) & mask);
        }
    } else {
        if (!(bits >= from || (accumulator << (to - bits)) & mask)) {
            throw new Error('Conversion requires padding but strict mode was used');
        }
    }
    return result;
}

function prefixToArray(prefix) : number[] {
    var result : number[] = [];
    for (var i = 0; i < prefix.length; i++) {
        const char = prefix.charCodeAt(i)
        result.push(char & 31);
    }
    return result;
}

var GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
var GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

function polymod(data) {
    // Treat c as 8 bits + 32 bits
    var c0 = 0,
        c1 = 1,
        C = 0;
    for (var j = 0; j < data.length; j++) {
        // Set C to c shifted by 35
        C = c0 >>> 3;
        // 0x[07]ffffffff
        c0 &= 0x07;
        // Shift as a whole number
        c0 <<= 5;
        c0 |= c1 >>> 27;
        // 0xffffffff >>> 5
        c1 &= 0x07ffffff;
        c1 <<= 5;
        // xor the last 5 bits
        c1 ^= data[j];
        for (var i = 0; i < GENERATOR1.length; ++i) {
            if (C & (1 << i)) {
                c0 ^= GENERATOR1[i];
                c1 ^= GENERATOR2[i];
            }
        }
    }
    c1 ^= 1;
    // Negative numbers -> large positive numbers
    if (c1 < 0) {
        c1 ^= 1 << 31;
        c1 += (1 << 30) * 2;
    }
    // Unless bitwise operations are used,
    // numbers are consisting of 52 bits, except
    // the sign bit. The result is max 40 bits,
    // so it fits perfectly in one number!
    return c0 * (1 << 30) * 4 + c1;
}

function checksumToArray(checksum) {
    var result : number[] = [];
    for (var i = 0; i < 8; ++i) {
        result.push(checksum & 31);
        checksum /= 32;
    }
    return result.reverse();
}

export function publicKeyToAddress(
    hashBuffer: Buffer,
    stripPrefix: boolean,
    type: string = 'schnorr',
): string {
    function getTypeBits(type) {
        switch (type) {
            case 'schnorr':
                return 0;
            case 'ecdsa':
                return 1;
            case 'p2sh':
                return 8;
            default:
                throw new Error('Invalid type:' + type);
        }
    }

    var eight0: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    var prefixData: number[] = prefixToArray('kaspa').concat([0]);
    var versionByte: number = getTypeBits(type);
    var arr: number[] = Array.prototype.slice.call(hashBuffer, 0);
    var payloadData: number[] = convertBits([versionByte].concat(arr), 8, 5);
    var checksumData: number[] = prefixData.concat(payloadData).concat(eight0);
    var payload = payloadData.concat(checksumToArray(polymod(checksumData)));
    if (stripPrefix === true) {
        return base32.encode(payload);
    } else {
        return 'kaspa:' + base32.encode(payload);
    }
}

export function addressToPublicKey(address: string): { version: number; publicKey: number[] } {
    const addrPart = address.split(':')[1];

    const payload = convertBits(base32.decode(addrPart), 5, 8);

    switch (payload[0]) {
        case 0:
        case 8:
            return { version: payload[0], publicKey: payload.slice(1, 33) };
        case 1:
            return { version: payload[0], publicKey: payload.slice(1, 34) };
        default:
            throw new Error('Unable to translate address to ScriptPublicKey');
    }
}

function numArrayToHexString(numArray : number[] = []): string {
    const hexArr : string[] = [];

    for (const num of numArray) {
        hexArr.push(('00' + num.toString(16)).slice(-2));
    }

    return hexArr.join('');
}

export function addressToScriptPublicKey(address: string): string {
    const { version, publicKey } = addressToPublicKey(address);

    switch (version) {
        case 0:
            return '20' + numArrayToHexString(publicKey) + 'ac';
        case 1:
            return '21' + numArrayToHexString(publicKey) + 'ab';
        case 8:
            return 'aa20' + numArrayToHexString(publicKey) + '87';
        default:
            throw new Error('Address could not be translated to script public key');
    }
}

export function sompiToKas(amount: number) {
    const amountStr = '00000000' + amount;
    return Number(amountStr.slice(0, -8) + '.' + amountStr.slice(-8));
}

export function kasToSompi(amount: number) {
    const amountStr = String(amount);
    const parts = amountStr.split('.');

    if (parts.length === 1) {
        return Number(amountStr + '00000000');
    } else if (parts.length === 2) {
        const [left, right] = parts;
        const rightStr = right + '00000000';
        return Number(left + rightStr.slice(0, 8));
    } else {
        throw new Error('Invalid amount');
    }
}

export const NETWORK_UTXO_LIMIT = 84;
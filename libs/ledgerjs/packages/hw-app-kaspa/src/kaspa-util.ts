import base32 from "./base32";

function convertBits(
    data: number[],
    from: number,
    to: number,
    strict: boolean = false,
): number[] {
    strict = strict || false;
    let accumulator = 0;
    let bits = 0;
    const result: number[] = [];
    const mask = (1 << to) - 1;
    for (let i = 0; i < data.length; i++) {
        const value = data[i];
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
            throw new Error(
                "Conversion requires padding but strict mode was used",
            );
        }
    }
    return result;
}

function prefixToArray(prefix): number[] {
    const result: number[] = [];
    for (let i = 0; i < prefix.length; i++) {
        const char = prefix.charCodeAt(i);
        result.push(char & 31);
    }
    return result;
}

const GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
const GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

function polymod(data) {
    // Treat c as 8 bits + 32 bits
    let c0 = 0,
        c1 = 1,
        C = 0;
    for (let j = 0; j < data.length; j++) {
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
        for (let i = 0; i < GENERATOR1.length; ++i) {
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
    const result: number[] = [];
    for (let i = 0; i < 8; ++i) {
        result.push(checksum & 31);
        checksum /= 32;
    }
    return result.reverse();
}

export function publicKeyToAddress(
    hashBuffer: Buffer,
): string {
    const eight0: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    const prefixData: number[] = prefixToArray("kaspa").concat([0]);
    const versionByte: number = 0;
    const arr: number[] = Array.prototype.slice.call(hashBuffer, 0);
    const payloadData: number[] = convertBits([versionByte].concat(arr), 8, 5);
    const checksumData: number[] = prefixData
        .concat(payloadData)
        .concat(eight0);
    const payload = payloadData.concat(checksumToArray(polymod(checksumData)));
    return "kaspa:" + base32.encode(payload);
}

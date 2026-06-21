/**
 * Performance test + benchmark for the Quantova codecs.
 *
 * Logs throughput (ops/s) for the address and QSignature codecs and asserts each stays
 * under a generous per-op budget, so a regression that makes a codec pathologically slow
 * (e.g. an accidental O(n^2) on the 7856-byte SPHINCS+ signature) fails CI. Budgets are set
 * far above measured numbers (~0.5-1.5 us/op) to avoid flakiness on slow CI machines.
 */
import { performance } from "node:perf_hooks";
import { QScheme, QSCHEMES } from "./schemes";
import { encodeQSignature, decodeQSignature, compactEncode, compactDecode } from "./qsignature";
import { encodeQAddress, decodeQAddress } from "../logic/address";

const fill = (n: number, s: number): Uint8Array => {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = (i * s + 7) & 0xff;
  return a;
};
const body = (() => {
  const b = new Uint8Array(20);
  b[0] = 0x40;
  for (let i = 1; i < 20; i++) b[i] = (i * 101 + 3) & 0xff;
  return b;
})();

function bench(name: string, fn: () => unknown, iters: number): number {
  fn();
  fn(); // warm up
  const t0 = performance.now();
  for (let i = 0; i < iters; i++) fn();
  const ms = performance.now() - t0;
  const usPerOp = (ms / iters) * 1000;
  // eslint-disable-next-line no-console
  console.log(`[bench] ${name.padEnd(28)} ${(iters / (ms / 1000)).toFixed(0)} ops/s  (${usPerOp.toFixed(2)} us/op)`);
  return usPerOp;
}

const BUDGET_US = 50; // generous; measured ~0.5-1.5 us/op

describe("coin-quantova codec performance", () => {
  const addr = encodeQAddress(body);

  it(`address encode/decode under ${BUDGET_US}us/op`, () => {
    expect(bench("address encode", () => encodeQAddress(body), 50000)).toBeLessThan(BUDGET_US);
    expect(bench("address decode", () => decodeQAddress(addr), 50000)).toBeLessThan(BUDGET_US);
  });

  for (const scheme of Object.values(QScheme)) {
    const p = QSCHEMES[scheme];
    const env = {
      scheme,
      signature: fill(p.maxSignatureLength, 3),
      publicKey: fill(p.publicKeyLength, 9),
    };
    const enc = encodeQSignature(env);
    it(`QSignature ${p.label} encode/decode under ${BUDGET_US}us/op`, () => {
      expect(bench(`QSignature encode ${scheme}`, () => encodeQSignature(env), 20000)).toBeLessThan(BUDGET_US);
      expect(bench(`QSignature decode ${scheme}`, () => decodeQSignature(enc), 20000)).toBeLessThan(BUDGET_US);
    });
  }

  it("compact encode+decode under 5us/op", () => {
    expect(bench("compact enc+dec", () => compactDecode(compactEncode(7856)), 200000)).toBeLessThan(5);
  });
});

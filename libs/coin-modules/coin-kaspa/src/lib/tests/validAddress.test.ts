import { isValidKaspaAddress } from "../kaspa-util";

describe("isValidKaspaAddress", () => {
  const testCases = [
    {
      input: "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
      expected: true,
    },
    {
      input: "kaspa:qqq7n4n232754kgw6jeu4zu86uerwn4kq9lnl2n2prwl3t2t9hvec720vk9s2",
      expected: true,
    },
    {
      input: "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crl",
      expected: true,
    },
    {
      input: "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crl00", // ecdsa
      expected: true,
    },
    {
      input: "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crl0", // wrong size
      expected: false,
    },
    {
      input: "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crb", // unknown char b
      expected: false,
    },
    {
      input: "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3cri", // unknown char i
      expected: false,
    },
  ];

  testCases.forEach(({ input, expected }, index) => {
    it(`should return ${expected} for test case ${index + 1}`, () => {
      expect(isValidKaspaAddress(input)).toBe(expected);
    });
  });
});

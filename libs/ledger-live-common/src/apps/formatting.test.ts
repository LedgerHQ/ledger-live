import { formatSize } from "./formatting";
describe("Formatting bytes depending on device block size", () => {
  const scenarios = [
    {
      bytes: 1024,
      blockSize: 4 * 1024,
      expectation: ["4", "kbUnit"],
      desc: "Bytes need to be rounded to block size.",
    },
    {
      bytes: 1024,
      blockSize: 4 * 1024,
      expectation: ["4", "kbUnit"],
      desc: "Bytes need to be rounded to block size.",
    },
    {
      bytes: 1150000,
      blockSize: 4 * 1024,
      expectation: ["1.10", "mbUnit"],
      desc: "Megabytes do have decimal points",
    },
    {
      bytes: 1150000,
      blockSize: 32,
      expectation: ["1.10", "mbUnit"],
      desc: "Megabytes do have decimal points",
    },
    {
      bytes: 1150000,
      blockSize: 4 * 1024,
      expectation: ["1.09", "mbUnit"],
      floor: true,
      desc: "Rounding down works",
    },
    {
      bytes: 1050,
      blockSize: 32,
      expectation: ["2", "kbUnit"],
      desc: "Nano S Plus will round to nearest ceil kb",
    },
  ];

  scenarios.map(({ bytes, blockSize, desc, expectation, floor }) => {
    it(desc, () => {
      expect(formatSize(bytes, blockSize, floor)).toMatchObject(expectation);
    });
  });
});

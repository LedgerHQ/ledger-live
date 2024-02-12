import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BitcoinLikeExplorer from "../explorer";
import network from "@ledgerhq/live-network/network";

jest.mock("@ledgerhq/live-network/network");

describe("BitcoinApi", () => {
  let explorer: BitcoinLikeExplorer;
  beforeEach(() => {
    explorer = new BitcoinLikeExplorer({
      cryptoCurrency: getCryptoCurrencyById("bitcoin"),
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("fetchTxs unit test", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockResolvedValue({
        data: {
          data: [
            {
              id: "e50d0ca77b4584a9feca88886e174f2863252e3488185826b6b7a3c25c9de659",
              hash: "e50d0ca77b4584a9feca88886e174f2863252e3488185826b6b7a3c25c9de659",
              received_at: "2023-05-03T08:17:57Z",
              lock_time: 0,
              fees: "21304",
              inputs: [
                {
                  output_hash: "214d4ee98c074bf4bc6e91c669f02a581d9a6d5a5e9476b05a3fccde508dfdfc",
                  output_index: 17,
                  input_index: 0,
                  value: "130000",
                  address: "bc1p4hdgsumm299ncy53g5xxlexsex0qqj0sl0flr5hp7d5q6xskw7rqq3srjc",
                  script_signature: "",
                  txinwitness: [
                    "bf23e6252bdaf8c15da8a5c5338b58a4747fd27fd37c2cb50efb8b76c58f7517047f4cda36befe2ee4d3c643e14ecf40e11602b9cfdb991f925b514e7ef001e8",
                  ],
                  sequence: 4294967293,
                },
              ],
              outputs: [
                {
                  output_index: 0,
                  value: "30000",
                  address: "bc1pd85hsqr75rg6fwwd8kmftd3tv26tgp3spkfmn4uga6t5xsv2talqmzqt0h",
                  script_hex:
                    "512069e978007ea0d1a4b9cd3db695b62b62b4b406300d93b9d788ee9743418a5f7e",
                },
                {
                  output_index: 1,
                  value: "78696",
                  address: "bc1p4hdgsumm299ncy53g5xxlexsex0qqj0sl0flr5hp7d5q6xskw7rqq3srjc",
                  script_hex:
                    "5120adda88737b514b3c1291450c6fe4d0c99e0049f0fbd3f1d2e1f3680d1a167786",
                },
              ],
              block: {
                hash: "0000000000000000000059c005bc8689ef7c4935034c201f94a0ef54d60b8aac",
                height: 788060,
                time: "2023-05-03T08:17:57Z",
              },
              confirmations: 920,
            },
            {
              id: "c842f547338a6c0e9c27ddd2b6afc5944c6b9401926579ad7897257ad7cd3c80",
              hash: "c842f547338a6c0e9c27ddd2b6afc5944c6b9401926579ad7897257ad7cd3c80",
              received_at: "2023-05-03T08:17:57Z",
              lock_time: 0,
              fees: "25208",
              inputs: [
                {
                  output_hash: "e50d0ca77b4584a9feca88886e174f2863252e3488185826b6b7a3c25c9de659",
                  output_index: 0,
                  input_index: 0,
                  value: "30000",
                  address: "bc1pd85hsqr75rg6fwwd8kmftd3tv26tgp3spkfmn4uga6t5xsv2talqmzqt0h",
                  script_signature: "",
                  txinwitness: [
                    "ca817c52fdb82530b15e3f35ca336257f69f649ca1b987aefe445d9ec2004e0dd475725b3d1c3496a5d82c4cc3af0119f94e3400d165c271b60865a05faea1e0",
                    "20117f692257b2331233b5705ce9c682be8719ff1b2b64cbca290bd6faeb54423eac0619f5aee08701750063036f7264010118746578742f706c61696e3b636861727365743d7574662d3800357b2270223a226272632d3230222c226f70223a226d696e74222c227469636b223a2276646278222c22616d74223a2231303030227d68",
                    "c1117f692257b2331233b5705ce9c682be8719ff1b2b64cbca290bd6faeb54423e",
                  ],
                  sequence: 4294967293,
                },
              ],
              outputs: [
                {
                  output_index: 0,
                  value: "546",
                  address: "bc1p4hdgsumm299ncy53g5xxlexsex0qqj0sl0flr5hp7d5q6xskw7rqq3srjc",
                  script_hex:
                    "5120adda88737b514b3c1291450c6fe4d0c99e0049f0fbd3f1d2e1f3680d1a167786",
                },
                {
                  output_index: 1,
                  value: "4246",
                  address: "bc1qrgt98epetd665p3the4qtsd7m30jdrte5g20k0",
                  script_hex: "00141a1653e4395b75aa062bbe6a05c1bedc5f268d79",
                },
              ],
              block: {
                hash: "0000000000000000000059c005bc8689ef7c4935034c201f94a0ef54d60b8aac",
                height: 788060,
                time: "2023-05-03T08:17:57Z",
              },
              confirmations: 920,
            },
          ],
          token: null,
        },
      });
    });
    it("fetchTxs api should return 2 transactions from explorer by using /address/${address.address}/txs endpoint", async () => {
      const params = {
        batch_size: 10000,
      };
      const txs = await explorer.fetchTxs(
        {
          account: 0,
          index: 0,
          address: "bc1pd85hsqr75rg6fwwd8kmftd3tv26tgp3spkfmn4uga6t5xsv2talqmzqt0h",
        },
        params,
      );
      expect(txs.length).toEqual(2);
      expect(txs[0].inputs.length).toEqual(1);
      expect(txs[0].outputs.length).toEqual(2);
    });
  });

  describe("getFees unit test", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockResolvedValue({
        data: {
          "2": 555985,
          "4": 504992,
          "6": 479059,
          last_updated: 1683675584,
        },
      });
    });
    it("getFees api should return 3 fees(slow, median and fast) by using /fees endpoint", async () => {
      const fees = await explorer.getFees();
      expect(Object.keys(fees).length).toBeGreaterThan(3);
      expect(fees["2"]).toEqual(555985);
    });
  });

  describe("getCurrentBlock unit test", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockResolvedValue({
        data: {
          hash: "00000000000000000003cbb024a4051d02e15df7c6c205493e23fa0c91ac6d03",
          height: 788997,
          time: "2023-05-09T23:20:52Z",
          txs: ["f3a2aebc6cf6f27a04d95809a97b78e78a47b100672612eac07f17dd5ff56474"],
        },
      });
    });
    it("getCurrentBlock api should return block height and hash by using /block/current endpoint", async () => {
      const currentBlock = await explorer.getCurrentBlock();
      expect(currentBlock?.height).toEqual(788997);
      expect(currentBlock?.hash).toEqual(
        "00000000000000000003cbb024a4051d02e15df7c6c205493e23fa0c91ac6d03",
      );
    });
  });

  describe("broadcast unit test", () => {
    beforeEach(() => {
      // @ts-expect-error method is mocked
      network.mockResolvedValue({
        data: {
          result: "f3a2aebc6cf6f27a04d95809a97b78e78a47b100672612eac07f17dd5ff56474",
        },
      });
    });
    it("broadcast api should return transaction hash by using /tx/send endpoint", async () => {
      const tx = await explorer.broadcast(
        "02000000000101f3a2aebc6cf6f27a04d95809a97b78e78a47b100672612eac07f17dd5ff564740000000000ffffffff02a0860100000000001600141a1653e4395b75aa062bbe6a05c1bedc5f268d790000000000000",
      );
      expect(tx.data.result).toEqual(
        "f3a2aebc6cf6f27a04d95809a97b78e78a47b100672612eac07f17dd5ff56474",
      );
    });
  });
});

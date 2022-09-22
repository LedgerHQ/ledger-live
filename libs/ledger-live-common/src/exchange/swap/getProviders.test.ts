import axios from "axios";
import getProviders from "./getProviders";
import { getEnv, setEnv } from "../../env";

const EXPECTED_RESULT_V4 = [
  {
    provider: "changelly",
    pairs: [
      {
        from: "bitcoin",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "zcash",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "zcash",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "ethereum_classic",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "ethereum_classic",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "ethereum",
        tradeMethod: "fixed",
      },
      {
        from: "bitcoin",
        to: "zcash",
        tradeMethod: "fixed",
      },
      {
        from: "bitcoin",
        to: "ethereum_classic",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum",
        to: "bitcoin",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum",
        to: "zcash",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum",
        to: "ethereum_classic",
        tradeMethod: "fixed",
      },
      {
        from: "zcash",
        to: "bitcoin",
        tradeMethod: "fixed",
      },
      {
        from: "zcash",
        to: "ethereum_classic",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum_classic",
        to: "bitcoin",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum_classic",
        to: "ethereum",
        tradeMethod: "fixed",
      },
      {
        from: "zcash",
        to: "bitcoin",
        tradeMethod: "fixed",
      },
      {
        from: "zcash",
        to: "ethereum_classic",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum_classic",
        to: "bitcoin",
        tradeMethod: "fixed",
      },
      {
        from: "ethereum_classic",
        to: "ethereum",
        tradeMethod: "fixed",
      },
    ],
  },
  {
    provider: "ftx",
    pairs: [
      {
        from: "bitcoin",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "bitcoin",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "zcash",
        tradeMethod: "float",
      },
      {
        from: "ethereum",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "zcash",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "zcash",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "zcash",
        to: "ethereum_classic",
        tradeMethod: "float",
      },
      {
        from: "ethereum_classic",
        to: "bitcoin",
        tradeMethod: "float",
      },
      {
        from: "ethereum_classic",
        to: "ethereum",
        tradeMethod: "float",
      },
      {
        from: "ethereum_classic",
        to: "zcash",
        tradeMethod: "float",
      },
    ],
  },
];

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

describe("swap/getProviders", () => {
  const DEFAULT_SWAP_API_BASE = getEnv("SWAP_API_BASE");

  afterAll(() => {
    // Restore DEFAULT_SWAP_API_BASE
    setEnv("SWAP_API_BASE", DEFAULT_SWAP_API_BASE);
  });

  describe("version 2", () => {
    const data = [
      {
        provider: "changelly",
        pairs: [
          {
            from: "bitcoin",
            to: "ethereum",
            tradeMethod: ["float", "fixed"],
          },
          {
            from: "bitcoin",
            to: "ethereum_classic",
            tradeMethod: ["float", "fixed"],
          },
        ],
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    beforeAll(() => {
      // set SWAP_API_BASE
      setEnv("SWAP_API_BASE", "https://swap.ledger.com/v2");
    });

    beforeEach(() => {
      mockedAxios.mockResolvedValue(Promise.resolve(resp));
    });

    afterEach(() => {
      mockedAxios.mockClear();
    });

    test("should not be called with whitelist", async () => {
      await getProviders();

      expect(mockedAxios).toBeCalledWith(
        expect.objectContaining({
          params: undefined,
        })
      );
    });
  });

  describe("version 3", () => {
    const data = [
      {
        provider: "changelly",
        pairs: [
          {
            from: "bitcoin",
            to: "ethereum",
            tradeMethod: ["float", "fixed"],
          },
          {
            from: "bitcoin",
            to: "ethereum_classic",
            tradeMethod: ["float", "fixed"],
          },
        ],
      },
    ];
    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    beforeAll(() => {
      // set SWAP_API_BASE
      setEnv("SWAP_API_BASE", "https://swap.ledger.com/v3");
    });

    beforeEach(() => {
      mockedAxios.mockResolvedValue(Promise.resolve(resp));
    });

    afterEach(() => {
      mockedAxios.mockClear();
    });

    test("should be called with whitelist", async () => {
      await getProviders();

      expect(mockedAxios).toBeCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            whitelist: expect.any(Array),
          }),
        })
      );
    });

    test("should throw error if no data", async () => {
      const emptyResp = { ...resp, data: [] };

      mockedAxios.mockResolvedValue(Promise.resolve(emptyResp));

      await expect(getProviders).rejects.toThrow("SwapNoAvailableProviders");
    });

    test("should return list of providers with pairs", async () => {
      const res = await getProviders();

      expect(res).toEqual(data);
    });
  });

  describe("version 4", () => {
    const data = {
      currencies: {
        "1": "bitcoin",
        "2": "ethereum",
        "3": "zcash",
        "4": "ethereum_classic",
      },
      providers: {
        changelly: [
          {
            methods: ["float"],
            pairs: {
              "1": [2, 3, 4],
              "2": [1, 3, 4],
            },
          },
          {
            methods: ["float", "fixed"],
            pairs: {
              "1": [2, 3, 4],
              "2": [1, 3, 4],
              "3": [1, 4],
              "4": [1, 2],
            },
          },
          {
            methods: ["fixed"],
            pairs: {
              "3": [1, 4],
              "4": [1, 2],
            },
          },
        ],
        ftx: [
          {
            methods: ["float"],
            pairs: {
              "1": [2, 3, 4],
              "2": [1, 3, 4],
              "3": [1, 2, 4],
              "4": [1, 2, 3],
            },
          },
        ],
      },
    };

    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    beforeAll(() => {
      // set SWAP_API_BASE
      setEnv("SWAP_API_BASE", "https://swap.ledger.com/v4");
    });

    beforeEach(() => {
      mockedAxios.mockResolvedValue(Promise.resolve(resp));
    });

    afterEach(() => {
      mockedAxios.mockClear();
    });

    test("should be called with whitelist", async () => {
      await getProviders();

      expect(mockedAxios).toBeCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            whitelist: expect.any(Array),
          }),
        })
      );
    });

    test("should throw error if no providers", async () => {
      const emptyResp = { ...resp, data: { ...data, providers: {} } };

      mockedAxios.mockResolvedValue(Promise.resolve(emptyResp));

      await expect(getProviders).rejects.toThrow("SwapNoAvailableProviders");
    });

    test("should return list of providers with pairs", async () => {
      const res = await getProviders();

      expect(res).toEqual(EXPECTED_RESULT_V4);
    });
  });
});

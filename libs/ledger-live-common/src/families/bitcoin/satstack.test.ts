import {
  isValidHost,
  checkRPCNodeConfig,
  editSatStackConfig,
  isSatStackEnabled,
  parseSatStackConfig,
  validateRPCNodeConfig,
  stringifySatStackConfig,
  setMockStatus,
  fetchSatStackStatus,
  statusObservable,
  requiresSatStackReady,
  SatStackConfig,
  SatStackStatus,
} from "./satstack";
import dataset from "./datasets/bitcoin";
import { inferDescriptorFromAccount, AccountDescriptor } from "./descriptor";
import { setEnv } from "../../env";
import { fromAccountRaw } from "../../account";
import { setSupportedCurrencies } from "../../currencies";

setSupportedCurrencies(["bitcoin"]);
jest.setTimeout(10000);
describe("validateRPCNodeConfig", () => {
  test("valid cases", () => {
    expect(
      validateRPCNodeConfig({
        host: "192.168.0.1:9999",
        username: "user",
        password: "pass",
      })
    ).toEqual([]);
    expect(
      validateRPCNodeConfig({
        host: "192.168.0.1:9999",
        username: "user",
        password: "pass",
        tls: false,
      })
    ).toEqual([]);
    expect(
      validateRPCNodeConfig({
        host: "192.168.0.1:9999",
        username: "user",
        password: "pass",
        tls: true,
      })
    ).toEqual([]);
    expect(
      validateRPCNodeConfig({
        host: "ledger.com",
        username: "user",
        password: "pass",
      })
    ).toEqual([]);
  });
  test("invalid cases", () => {
    const errors = validateRPCNodeConfig({
      host: "",
      username: "",
      password: "",
    });
    expect(errors.length).toEqual(3);
    expect(errors.map((e) => e.field).sort()).toEqual([
      "host",
      "password",
      "username",
    ]);
    expect(errors.every((e) => e.error instanceof Error)).toBe(true);
  });
});
describe("isValidHost", () => {
  test("invalid", () => {
    expect(isValidHost("")).toBe(false);
    expect(isValidHost("a b")).toBe(false);
    expect(isValidHost("ledger .com")).toBe(false);
  });
  test("valid", () => {
    expect(isValidHost("52.207.220.222/node/btc/")).toBe(true);
    expect(isValidHost("ledger.com/foo")).toBe(true);
    expect(isValidHost("ledger.com")).toBe(true);
    expect(isValidHost("localhost")).toBe(true);
    expect(isValidHost("0.0.0.0")).toBe(true);
    expect(isValidHost("127.0.0.1")).toBe(true);
    expect(isValidHost("192.168.0.1")).toBe(true);
    expect(isValidHost("192.168.0.1:8888")).toBe(true);
    expect(isValidHost("locahost:8888")).toBe(true);
    expect(isValidHost("ledger:8888")).toBe(true);
    expect(isValidHost("ledger1:8888")).toBe(true);
    expect(isValidHost("ledger-1:8888")).toBe(true);
  });
});
const mockConfig = {
  host: "localhost",
  username: "user",
  password: "pass",
};
describe("checkRPCNodeConfig", () => {
  beforeAll(() => {
    setEnv("MOCK", "1");
  });
  afterAll(() => {
    setEnv("MOCK", "");
  });
  test("default is good", async () => {
    await checkRPCNodeConfig(mockConfig);
  });
  test("disconnected case", async () => {
    setMockStatus({
      type: "node-disconnected",
    });

    try {
      await expect(async () => {
        await checkRPCNodeConfig(mockConfig);
      }).rejects.toThrow();
    } finally {
      setMockStatus({
        type: "ready",
      });
    }
  });
});
describe("parseSatStackConfig", () => {
  test("parse a config with descriptors", () => {
    expect(
      parseSatStackConfig(`{
        "accounts": [
          {
            "external": "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/0/*)",
            "internal": "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/1/*)"
          },
          {
            "external": "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/0/*)",
            "internal": "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/1/*)",
            "_whatever": 42
          }
        ],
        "rpcurl": "localhost",
        "rpcuser": "user",
        "rpcpass": "pass",
        "notls": true,
        "_whatever": {"a":"b"}
      }`)
    ).toEqual({
      accounts: [
        {
          descriptor: {
            external:
              "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/0/*)",
            internal:
              "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/1/*)",
          },
          extra: {},
        },
        {
          descriptor: {
            external:
              "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/0/*)",
            internal:
              "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/1/*)",
          },
          extra: {
            _whatever: 42,
          },
        },
      ],
      extra: {
        _whatever: {
          a: "b",
        },
      },
      node: {
        host: "localhost",
        password: "pass",
        tls: false,
        username: "user",
      },
    });
  });
  test("invalid values", () => {
    expect(() => parseSatStackConfig("")).toThrow();
    expect(parseSatStackConfig("{}")).toBeUndefined();
    expect(parseSatStackConfig('{"accounts":[]}')).toBeUndefined();
    expect(
      parseSatStackConfig(
        '{"accounts":[],"rpcurl":"localhost","rpcuser":"user"}'
      )
    ).toBeUndefined();
    expect(
      parseSatStackConfig(
        '{"accounts":[],"rpcurl":"localhost","rpcpass":"pass"}'
      )
    ).toBeUndefined();
    expect(
      parseSatStackConfig('{"accounts":[],"rpcuser":"user","rpcpass": "pass"}')
    ).toBeUndefined();
  });
});
describe("stringifySatStackConfig", () => {
  test("stringify config with accounts", () => {
    expect(
      stringifySatStackConfig({
        node: mockConfig,
        extra: {
          foo: "bar",
        },
        accounts: (
          (dataset.accounts || [])
            .map((a) => inferDescriptorFromAccount(fromAccountRaw(a.raw)))
            .filter(Boolean) as AccountDescriptor[]
        ).map((descriptor, i) => ({
          descriptor,
          extra: {
            i,
          },
        })),
      })
    ).toEqual(`{
  "accounts": [
    {
      "external": "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/0/*)",
      "internal": "pkh([224b6226/44'/0'/0']xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn/1/*)",
      "i": 0
    },
    {
      "external": "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/0/*)",
      "internal": "wpkh([d6a9e45e/84'/0'/1']xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2/1/*)",
      "i": 1
    }
  ],
  "rpcurl": "localhost",
  "rpcuser": "user",
  "rpcpass": "pass",
  "notls": true,
  "foo": "bar"
}`);
  });
});
describe("editSatStackConfig", () => {
  const config = {
    node: { ...mockConfig, tls: false },
    extra: {
      foo: "bar",
    },
    accounts: (dataset.accounts || [])
      .map((a) => inferDescriptorFromAccount(fromAccountRaw(a.raw)))
      .filter(Boolean)
      .map((descriptor, i) => ({
        descriptor,
        extra: {
          i,
        },
      })),
  };
  test("restore identity", () => {
    expect(
      parseSatStackConfig(stringifySatStackConfig(config as SatStackConfig))
    ).toEqual(config);
  });
  test("update node config", () => {
    expect(
      editSatStackConfig(
        {
          ...config,
          node: {
            ...config.node,
            host: "ledger.com",
            password: "update",
          },
        } as SatStackConfig,
        {
          node: config.node,
        }
      )
    ).toEqual(config);
  });
  test("append accounts", () => {
    expect(
      editSatStackConfig(
        { ...config, accounts: config.accounts.slice(0, 1) } as any,
        {
          accounts: config.accounts.slice(1) as any,
        }
      )
    ).toEqual(config);
  });
  test("dedup accounts", () => {
    expect(
      editSatStackConfig(
        { ...config, accounts: config.accounts.slice(0, 1) } as any,
        {
          accounts: config.accounts,
        } as any
      )
    ).toEqual(config);
  });
});
describe("isSatStackEnabled", () => {
  afterEach(() => {
    setEnv("SATSTACK", false);
  });
  test("enabled", () => {
    setEnv("SATSTACK", true);
    expect(isSatStackEnabled()).toBe(true);
  });
  test("disabled", () => {
    expect(isSatStackEnabled()).toBe(false);
  });
});
describe("fetchSatStackStatus", () => {
  beforeEach(() => {
    setEnv("MOCK", "1");
    setMockStatus({
      type: "ready",
    });
  });
  afterEach(() => {
    setEnv("SATSTACK", false);
    setEnv("MOCK", "");
    setMockStatus({
      type: "ready",
    });
  });
  test("disconnected", async () => {
    await expect(fetchSatStackStatus()).resolves.toEqual({
      type: "satstack-disconnected",
    });
  });
  test("scanning", async () => {
    setEnv("SATSTACK", true);
    setMockStatus({
      type: "scanning",
      progress: 0.42,
    });
    await expect(fetchSatStackStatus()).resolves.toEqual({
      type: "scanning",
      progress: 0.42,
    });
  });
  test("ready", async () => {
    setEnv("SATSTACK", true);
    await expect(fetchSatStackStatus()).resolves.toEqual({
      type: "ready",
    });
  });
});
describe("statusObservable", () => {
  beforeEach(() => {
    setEnv("MOCK", "1");
    setMockStatus({
      type: "ready",
    });
  });
  afterEach(() => {
    setEnv("SATSTACK", false);
    setEnv("MOCK", "");
    setMockStatus({
      type: "ready",
    });
  });
  test("events", async () => {
    setEnv("SATSTACK", true);
    const stack = [
      {
        type: "ready",
      },
      {
        type: "node-disconnected",
      },
      {
        type: "node-disconnected",
      },
      {
        type: "satstack-disconnected",
      },
      {
        type: "ready",
      },
    ];
    let success;
    const p = new Promise((s) => {
      success = s;
    });
    let last = {
      type: "ready",
    };
    const u = statusObservable.subscribe((e) => {
      if (stack.length === 0) {
        u.unsubscribe();
        success();
      } else {
        expect(e).toEqual(last);
        setMockStatus((last = stack.splice(0, 1)[0]) as SatStackStatus);
      }
    });
    await p;
  });
});
describe("requiresSatStackReady", () => {
  beforeEach(() => {
    setEnv("MOCK", "1");
  });
  afterEach(() => {
    setMockStatus({
      type: "ready",
    });
    setEnv("SATSTACK", false);
    setEnv("MOCK", "");
  });
  test("without satstack", async () => {
    await expect(requiresSatStackReady()).resolves.toBe(undefined);
  });
  test("with satstack", async () => {
    setEnv("SATSTACK", true);
    await expect(requiresSatStackReady()).resolves.toBe(undefined);
  });
  test("with satstack not ready", async () => {
    setEnv("SATSTACK", true);
    setMockStatus({
      type: "node-disconnected",
    });
    await expect(requiresSatStackReady()).rejects.toThrow();
  });
});

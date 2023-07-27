import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AccountShapeInfo } from "../../bridge/jsHelpers";
import { CosmosAPI } from "./api/Cosmos";
import { getAccountShape } from "./js-synchronisation";
import { CosmosAccount, CosmosTx } from "./types";
import * as jsHelpers from "../../bridge/jsHelpers";

jest.mock("./api/Cosmos");
jest.mock("../../account");
jest.mock("../../bridge/jsHelpers");

const infoMock = {
  currency: {
    units: [{}, { code: "uatom" }],
  } as CryptoCurrency,
  address: "address",
  index: 0,
} as AccountShapeInfo;

const baseAccountInfoMock = {
  txs: [],
  delegations: [],
  unbondings: [],
  balances: new BigNumber(0),
};

const baseTxMock = {
  logs: [],
  txhash: "2",
  tx: {
    auth_info: {
      signer_infos: [{ sequence: "seq" }],
      fee: { amount: [{ denom: "uatom", amount: new BigNumber(1) }] },
    },
  },
};

const syncConfig = {} as SyncConfig;

function mockAccountInfo(
  partialMock: Partial<{
    delegations: any;
    unbondings: any;
    balances: BigNumber;
    txs: any[];
  }>,
) {
  // @ts-expect-error mocked
  CosmosAPI.mockReturnValueOnce({
    getAccountInfo: jest.fn().mockResolvedValue({ ...baseAccountInfoMock, ...partialMock }),
  });
}

function mockCosmosTx(tx: Partial<CosmosTx>) {
  return {
    logs: [
      {
        type: "withdraw_rewards",
        events: [
          {
            type: "withdraw_rewards",
            attributes: [
              {
                key: "amount",
                value: "10uatom",
              },
              {
                key: "validator",
                value: "validatorAddressHehe",
              },
            ],
          },
        ],
        attributes: [],
      },
    ],
    txhash: "2",
    tx: {
      auth_info: {
        signer_infos: [{ sequence: "seq" }],
        fee: { amount: [{ denom: "uatom", amount: new BigNumber(0) }] },
      },
      body: {},
    },
    ...tx,
  } as unknown as CosmosTx;
}

describe("getAccountShape", () => {
  let mergeOpsSpy: jest.SpyInstance;
  beforeEach(() => {
    // @ts-expect-error mocked
    CosmosAPI.mockClear();
    mergeOpsSpy = jest
      .spyOn(jsHelpers, "mergeOps")
      .mockImplementation((existing: Operation[], newlyFetched: Operation[]): Operation[] => [
        ...existing,
        ...newlyFetched,
      ]);
  });

  afterEach(() => {
    mergeOpsSpy.mockReset();
  });

  it("should sum up delegations to balance", async () => {
    mockAccountInfo({
      balances: new BigNumber(1),
      delegations: [{ amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.balance).toEqual(new BigNumber(3));
  });

  it("should sum up delegation balances and assign it in cosmosResources delegatedBalances", async () => {
    mockAccountInfo({
      delegations: [{ amount: new BigNumber(1) }, { amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account as CosmosAccount).cosmosResources.delegatedBalance).toEqual(new BigNumber(3));
  });

  it("should sum up unbondings to balance", async () => {
    mockAccountInfo({
      balances: new BigNumber(2),
      unbondings: [{ amount: new BigNumber(3) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.balance).toEqual(new BigNumber(5));
  });

  it("estimate spendable balance correctly", async () => {
    // Shouldn't it be 97 ?
    mockAccountInfo({
      balances: new BigNumber(100),
      unbondings: [{ amount: new BigNumber(1) }],
      delegations: [{ amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.spendableBalance).toEqual(new BigNumber(100));
  });

  it("should reduce balance to 0 if spendable balance is negative", async () => {
    mockAccountInfo({
      balances: new BigNumber(-10),
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should sum up pendingRewards and insert it in cosmosResources", async () => {
    mockAccountInfo({
      delegations: [
        {
          pendingRewards: new BigNumber(1),
        },
        {
          pendingRewards: new BigNumber(2),
        },
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account as CosmosAccount).cosmosResources.pendingRewardsBalance).toEqual(
      new BigNumber(3),
    );
  });

  it("set spendable balance to 0 if spendable balance is negative in initial account", async () => {
    mockAccountInfo({});
    const account = await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          spendableBalance: new BigNumber(-10),
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(account.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should estimate operations count correctly", async () => {
    mockAccountInfo({});
    const account = await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          operations: [{}, {}],
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(account.operationsCount).toEqual(2);
  });

  it("should merge old operations with newly fetched ones", async () => {
    const existingOperations = [{ hash: "3", id: "3" }];
    mockAccountInfo({});
    await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          operations: existingOperations,
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(mergeOpsSpy.mock.calls[0][0]).toEqual(existingOperations);
  });

  it("should add newly fetched operations", async () => {
    mockAccountInfo({ txs: [mockCosmosTx({})] });
    await getAccountShape(infoMock, syncConfig);
    expect(mergeOpsSpy.mock.calls[0][1]).toBeTruthy();
  });

  it("should assign memo correctly", async () => {
    const memo = "i am a memo :)";
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: { memo },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].extra.memo).toEqual(memo);
  });

  it("should list claim reward operations correctly with one delegation", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          logs: [
            {
              type: "withdraw_rewards",
              events: [
                {
                  type: "withdraw_rewards",
                  attributes: [
                    {
                      key: "amount",
                      value: "3uatom",
                    },
                    {
                      key: "validator",
                      value: "validatorAddressNumeroUno",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(3));
    expect((account.operations as Operation[])[0].extra.validators).toEqual([
      {
        address: "validatorAddressNumeroUno",
        amount: new BigNumber(3),
      },
    ]);
  });

  it("should list claim reward operations correctly with multiple delegations", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          logs: [
            {
              type: "withdraw_rewards",
              events: [
                {
                  type: "withdraw_rewards",
                  attributes: [
                    {
                      key: "amount",
                      value: "10uatom",
                    },
                    {
                      key: "validator",
                      value: "validatorAddressHehe",
                    },
                  ],
                },
                {
                  type: "withdraw_rewards",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "validator",
                      value: "validatorAddressTwo",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(15));
    expect((account.operations as Operation[])[0].extra.validators).toEqual([
      {
        address: "validatorAddressHehe",
        amount: new BigNumber(10),
      },
      {
        address: "validatorAddressTwo",
        amount: new BigNumber(5),
      },
    ]);
  });

  it("should parse an operation correctly with multiple transfers(received operations)", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          logs: [
            {
              type: "transfer",
              events: [
                {
                  type: "transfer",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "sender",
                      value: "senderAddress",
                    },
                    {
                      key: "recipient",
                      value: "address",
                    },
                  ],
                },
                {
                  type: "transfer",
                  attributes: [
                    {
                      key: "amount",
                      value: "6uatom",
                    },
                    {
                      key: "sender",
                      value: "senderAddress",
                    },
                    {
                      key: "recipient",
                      value: "address",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(11));
    expect((account.operations as Operation[])[0].type).toEqual("IN");
  });

  it("should parse an operation correctly with multiple transfers(sent operations)", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: { memo: "memo" },
            auth_info: baseTxMock.tx.auth_info,
          },
          logs: [
            {
              type: "transfer",
              events: [
                {
                  type: "transfer",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "recipient",
                      value: "senderAddress",
                    },
                    {
                      key: "sender",
                      value: "address",
                    },
                  ],
                },
                {
                  type: "transfer",
                  attributes: [
                    {
                      key: "amount",
                      value: "6uatom",
                    },
                    {
                      key: "recipient",
                      value: "senderAddress",
                    },
                    {
                      key: "sender",
                      value: "address",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(12)); // 1+ 5 + 6
    expect((account.operations as Operation[])[0].type).toEqual("OUT");
  });

  it("should parse an operation correctly with multiple delegations", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: { memo: "memo" },
            auth_info: baseTxMock.tx.auth_info,
          },
          logs: [
            {
              type: "delegate",
              events: [
                {
                  type: "delegate",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "validator",
                      value: "address",
                    },
                  ],
                },
                {
                  type: "delegate",
                  attributes: [
                    {
                      key: "amount",
                      value: "6uatom",
                    },
                    {
                      key: "validator",
                      value: "address",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as Operation[])[0].type).toEqual("DELEGATE");
    expect((account.operations as Operation[])[0].extra.validators).toEqual([
      {
        address: "address",
        amount: new BigNumber(5),
      },
      {
        address: "address",
        amount: new BigNumber(6),
      },
    ]);
  });

  it("should parse an operation correctly with multiple redelegate", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: { memo: "memo" },
            auth_info: baseTxMock.tx.auth_info,
          },
          logs: [
            {
              type: "redelegate",
              events: [
                {
                  type: "redelegate",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "validator_src",
                      value: "address_src",
                    },
                    {
                      key: "validator_dst",
                      value: "address1",
                    },
                  ],
                },
                {
                  type: "redelegate",
                  attributes: [
                    {
                      key: "amount",
                      value: "6uatom",
                    },
                    {
                      key: "validator_src",
                      value: "address_src",
                    },
                    {
                      key: "validator_dst",
                      value: "address2",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as Operation[])[0].type).toEqual("REDELEGATE");
    expect((account.operations as Operation[])[0].extra.sourceValidator).toEqual("address_src");
    expect((account.operations as Operation[])[0].extra.validators).toEqual([
      {
        address: "address1",
        amount: new BigNumber(5),
      },
      {
        address: "address2",
        amount: new BigNumber(6),
      },
    ]);
  });

  it("should parse an operation correctly with multiple unredelegate", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: { memo: "memo" },
            auth_info: baseTxMock.tx.auth_info,
          },
          logs: [
            {
              type: "unbond",
              events: [
                {
                  type: "unbond",
                  attributes: [
                    {
                      key: "amount",
                      value: "5uatom",
                    },
                    {
                      key: "validator",
                      value: "address1",
                    },
                  ],
                },
                {
                  type: "unbond",
                  attributes: [
                    {
                      key: "amount",
                      value: "6uatom",
                    },
                    {
                      key: "validator",
                      value: "address2",
                    },
                  ],
                },
              ],
              attributes: [],
            },
          ],
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as Operation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as Operation[])[0].type).toEqual("UNDELEGATE");
    expect((account.operations as Operation[])[0].extra.validators).toEqual([
      {
        address: "address1",
        amount: new BigNumber(5),
      },
      {
        address: "address2",
        amount: new BigNumber(6),
      },
    ]);
  });
});

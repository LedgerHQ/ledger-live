import type { SuiGraphQLClient } from "./client";
import { makeSuiClientFromGraphQL } from "./sui-client-adapter";

/** Build a SuiGraphQLClient stub whose `query` returns queued responses in order. */
const stubApi = (...responses: unknown[]): { api: SuiGraphQLClient; query: jest.Mock } => {
  const query = jest.fn();
  responses.forEach(r => query.mockResolvedValueOnce(r));
  return { api: { query } as unknown as SuiGraphQLClient, query };
};

describe("makeSuiClientFromGraphQL", () => {
  describe("getCurrentSystemState", () => {
    it("projects epochId + referenceGasPrice + startTimestamp", async () => {
      const { api } = stubApi({
        data: {
          epoch: { epochId: 42, referenceGasPrice: "1000", startTimestamp: "1700000000000" },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getCurrentSystemState({} as never);
      expect(out.systemState.epoch).toBe("42");
      expect(out.systemState.referenceGasPrice).toBe("1000");
      expect(out.systemState.epochStartTimestampMs).toBe("1700000000000");
    });

    it("throws when referenceGasPrice is missing — build path can't ship silently-wrong prices", async () => {
      const { api } = stubApi({ data: { epoch: { epochId: 1, referenceGasPrice: null } } });
      const client = makeSuiClientFromGraphQL(api);
      await expect(client.core.getCurrentSystemState({} as never)).rejects.toThrow(
        /missing referenceGasPrice/,
      );
    });
  });

  describe("getChainIdentifier", () => {
    it("returns the chain identifier string", async () => {
      const { api } = stubApi({ data: { chainIdentifier: "abcdef01" } });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getChainIdentifier({} as never);
      expect(out.chainIdentifier).toBe("abcdef01");
    });

    it("returns empty string when chainIdentifier is missing", async () => {
      const { api } = stubApi({ data: { chainIdentifier: null } });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getChainIdentifier({} as never);
      expect(out.chainIdentifier).toBe("");
    });
  });

  describe("getBalance", () => {
    it("finds a matching coinType on the first page and projects total/coinBalance/address", async () => {
      const { api } = stubApi({
        data: {
          address: {
            balances: {
              nodes: [
                {
                  coinType: { repr: "0x2::sui::SUI" },
                  totalBalance: "1000",
                  addressBalance: "200",
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getBalance({
        owner: "0xabc",
        coinType: "0x2::sui::SUI",
      } as never);
      expect(out.balance.balance).toBe("1000");
      expect(out.balance.addressBalance).toBe("200");
      // SIP-58 contract: coinBalance = total − addressBalance = 1000 − 200 = 800
      expect(out.balance.coinBalance).toBe("800");
    });

    it("paginates through balances pages until the target coinType is found", async () => {
      const { api, query } = stubApi(
        {
          data: {
            address: {
              balances: {
                nodes: [
                  { coinType: { repr: "0x9::usdc::USDC" }, totalBalance: "500", addressBalance: "0" },
                ],
                pageInfo: { hasNextPage: true, endCursor: "cursor-1" },
              },
            },
          },
        },
        {
          data: {
            address: {
              balances: {
                nodes: [
                  { coinType: { repr: "0x2::sui::SUI" }, totalBalance: "777", addressBalance: "0" },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          },
        },
      );
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getBalance({
        owner: "0xabc",
        coinType: "0x2::sui::SUI",
      } as never);
      expect(out.balance.balance).toBe("777");
      expect(query).toHaveBeenCalledTimes(2);
    });

    it("returns '0' total/coinBalance when the coinType is absent across all pages", async () => {
      const { api } = stubApi({
        data: {
          address: {
            balances: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getBalance({
        owner: "0xabc",
        coinType: "0x2::sui::SUI",
      } as never);
      expect(out.balance.balance).toBe("0");
      expect(out.balance.coinBalance).toBe("0");
      expect(out.balance.addressBalance).toBe("0");
    });

    it("normalises canonical 32-byte coinType (matches shorthand callers)", async () => {
      const canonical = "0x" + "0".repeat(63) + "2::sui::SUI";
      const { api } = stubApi({
        data: {
          address: {
            balances: {
              nodes: [
                { coinType: { repr: canonical }, totalBalance: "9000", addressBalance: "0" },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getBalance({
        owner: "0xabc",
        coinType: "0x2::sui::SUI",
      } as never);
      expect(out.balance.balance).toBe("9000");
    });
  });

  describe("getMoveFunction", () => {
    it("projects parameters/returns/visibility/typeParameters for a public function", async () => {
      const { api } = stubApi({
        data: {
          package: {
            module: {
              function: {
                visibility: "PUBLIC",
                isEntry: true,
                typeParameters: [{ constraints: [] }],
                parameters: [{ signature: { ref: "&mut", body: "u64" } }],
                return: [{ signature: { body: "bool" } }],
              },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getMoveFunction({
        packageId: "0xpkg",
        moduleName: "mod",
        name: "fn",
      } as never);
      expect(out.function.visibility).toBe("public");
      expect(out.function.parameters[0]).toEqual({
        reference: "mutable",
        body: { $kind: "u64" },
      });
      expect(out.function.returns[0]).toEqual({
        reference: null,
        body: { $kind: "bool" },
      });
    });

    it("maps FRIEND/PRIVATE visibility correctly", async () => {
      const responseFor = (visibility: string) => ({
        data: {
          package: {
            module: {
              function: { visibility, isEntry: false, typeParameters: [], parameters: [], return: [] },
            },
          },
        },
      });
      const { api } = stubApi(responseFor("FRIEND"), responseFor("PRIVATE"));
      const client = makeSuiClientFromGraphQL(api);
      const friend = await client.core.getMoveFunction({
        packageId: "0xpkg",
        moduleName: "m",
        name: "f",
      } as never);
      expect(friend.function.visibility).toBe("friend");

      const priv = await client.core.getMoveFunction({
        packageId: "0xpkg",
        moduleName: "m",
        name: "f",
      } as never);
      expect(priv.function.visibility).toBe("private");
    });

    it("falls back to 'unknown' visibility for an unrecognised value", async () => {
      const { api } = stubApi({
        data: {
          package: {
            module: {
              function: {
                visibility: "WAT",
                isEntry: false,
                typeParameters: [],
                parameters: [],
                return: [],
              },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getMoveFunction({
        packageId: "0xpkg",
        moduleName: "m",
        name: "f",
      } as never);
      expect(out.function.visibility).toBe("unknown");
    });

    it("throws when the function is missing from the schema response", async () => {
      const { api } = stubApi({
        data: { package: { module: { function: null } } },
      });
      const client = makeSuiClientFromGraphQL(api);
      await expect(
        client.core.getMoveFunction({
          packageId: "0xpkg",
          moduleName: "m",
          name: "nope",
        } as never),
      ).rejects.toThrow(/not found/);
    });
  });

  describe("listCoins", () => {
    it("projects coin nodes into the Mysten Coin shape", async () => {
      const { api } = stubApi({
        data: {
          address: {
            objects: {
              nodes: [
                {
                  address: "0xcoin1",
                  version: 7,
                  digest: "0xdgst1",
                  contents: { json: { balance: "500" } },
                },
                {
                  address: "0xcoin2",
                  version: 9,
                  digest: "0xdgst2",
                  contents: { json: { balance: 250 } },
                },
              ],
              pageInfo: { hasNextPage: true, endCursor: "next" },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.listCoins({
        owner: "0xowner",
        coinType: "0x2::sui::SUI",
        limit: 10,
      } as never);
      expect(out.objects).toHaveLength(2);
      expect(out.objects[0]).toMatchObject({
        objectId: "0xcoin1",
        version: "7",
        digest: "0xdgst1",
        type: "0x2::coin::Coin<0x2::sui::SUI>",
        balance: "500",
      });
      expect(out.objects[1].balance).toBe("250");
      expect(out.hasNextPage).toBe(true);
      expect(out.cursor).toBe("next");
    });

    it("clamps a caller-supplied limit above 50 to the server cap", async () => {
      const { api, query } = stubApi({
        data: { address: { objects: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } },
      });
      const client = makeSuiClientFromGraphQL(api);
      await client.core.listCoins({ owner: "0xowner", coinType: "0x2::sui::SUI", limit: 999 } as never);
      expect(query.mock.calls[0][0].variables.first).toBe(50);
    });

    it("falls back to DEFAULT_SUI_COIN_TYPE when coinType is omitted", async () => {
      const { api, query } = stubApi({
        data: { address: { objects: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } },
      });
      const client = makeSuiClientFromGraphQL(api);
      await client.core.listCoins({ owner: "0xowner" } as never);
      expect(query.mock.calls[0][0].variables.type).toBe("0x2::coin::Coin<0x2::sui::SUI>");
    });

    it("returns balance '0' when contents.json is missing or non-object", async () => {
      const { api } = stubApi({
        data: {
          address: {
            objects: {
              nodes: [
                { address: "0xc", version: 1, digest: "0xd", contents: null },
                { address: "0xd", version: 2, digest: "0xe", contents: { json: "scalar" } },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.listCoins({ owner: "0x0", coinType: "0x2::sui::SUI" } as never);
      expect(out.objects.map(o => o.balance)).toEqual(["0", "0"]);
    });
  });

  describe("getObjects", () => {
    const baseObj = (overrides: Record<string, unknown> = {}) => ({
      address: "0xobj",
      version: 5,
      digest: "0xdgst",
      asMoveObject: { contents: { type: { repr: "0x2::coin::Coin<0x2::sui::SUI>" } } },
      objectBcs: null,
      ...overrides,
    });

    it("projects AddressOwner objects with the address pulled out of the nested .address.address", async () => {
      const { api } = stubApi({
        data: {
          object: baseObj({
            owner: { __typename: "AddressOwner", address: { address: "0xowner" } },
          }),
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      const obj = out.objects[0] as unknown as Record<string, unknown>;
      expect((obj.owner as { $kind: string }).$kind).toBe("AddressOwner");
      expect((obj.owner as { AddressOwner: string }).AddressOwner).toBe("0xowner");
      expect(obj.objectId).toBe("0xobj");
      expect(obj.version).toBe("5");
      expect(obj.type).toBe("0x2::coin::Coin<0x2::sui::SUI>");
    });

    it("maps Shared owners with initialSharedVersion", async () => {
      const { api } = stubApi({
        data: {
          object: baseObj({
            owner: { __typename: "Shared", initialSharedVersion: 42 },
          }),
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      const owner = (out.objects[0] as { owner: { $kind: string; Shared: { initialSharedVersion: string } } }).owner;
      expect(owner.$kind).toBe("Shared");
      expect(owner.Shared.initialSharedVersion).toBe("42");
    });

    it("maps Immutable owners", async () => {
      const { api } = stubApi({
        data: { object: baseObj({ owner: { __typename: "Immutable" } }) },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      expect((out.objects[0] as { owner: { $kind: string } }).owner.$kind).toBe("Immutable");
    });

    it("maps ObjectOwner with the parent object address", async () => {
      const { api } = stubApi({
        data: {
          object: baseObj({
            owner: { __typename: "ObjectOwner", address: { address: "0xparent" } },
          }),
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      const owner = (out.objects[0] as { owner: { $kind: string; ObjectOwner: string } }).owner;
      expect(owner.$kind).toBe("ObjectOwner");
      expect(owner.ObjectOwner).toBe("0xparent");
    });

    it("coerces unknown owner typenames to Immutable rather than failing the build", async () => {
      const { api } = stubApi({
        data: { object: baseObj({ owner: { __typename: "MystenFutureOwner" } }) },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      expect((out.objects[0] as { owner: { $kind: string } }).owner.$kind).toBe("Immutable");
    });

    it("returns an Error in place of an object when the schema reports it missing", async () => {
      const { api } = stubApi({ data: { object: null } });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xmissing"] } as never);
      expect(out.objects[0]).toBeInstanceOf(Error);
      expect((out.objects[0] as Error).message).toMatch(/not found/);
    });

    it("wraps a thrown error per-id without aborting the whole batch", async () => {
      const { api } = stubApi(
        { data: { object: baseObj({ owner: { __typename: "Immutable" } }) } },
      );
      const client = makeSuiClientFromGraphQL(api);
      // Override the second .query() call to reject.
      (api.query as jest.Mock).mockRejectedValueOnce(new Error("network down"));
      const out = await client.core.getObjects({ objectIds: ["0xobj1", "0xobj2"] } as never);
      expect(out.objects).toHaveLength(2);
      // promiseAllBatched preserves input order — first id maps to the resolved fixture, second to the error.
      expect((out.objects[0] as { objectId: string }).objectId).toBe("0xobj");
      expect(out.objects[1]).toBeInstanceOf(Error);
    });

    it("decodes objectBcs from base64 into a Uint8Array when present", async () => {
      // toBase64(Uint8Array([1,2,3,4])) = "AQIDBA=="
      const { api } = stubApi({
        data: {
          object: baseObj({
            owner: { __typename: "Immutable" },
            objectBcs: "AQIDBA==",
          }),
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.getObjects({ objectIds: ["0xobj"] } as never);
      const bcs = (out.objects[0] as unknown as { objectBcs: Uint8Array }).objectBcs;
      expect(bcs).toBeInstanceOf(Uint8Array);
      expect(Array.from(bcs)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("simulateTransaction", () => {
    it("returns a Transaction $kind with projected gas summary on SUCCESS", async () => {
      const { api } = stubApi({
        data: {
          simulateTransaction: {
            effects: {
              status: "SUCCESS",
              gasEffects: {
                gasSummary: {
                  computationCost: "100",
                  storageCost: "200",
                  storageRebate: "50",
                },
              },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.simulateTransaction({
        transaction: new Uint8Array([0, 1, 2]),
      } as never);
      expect((out as { $kind: string }).$kind).toBe("Transaction");
      const tx = (out as { Transaction: { effects: { gasUsed: Record<string, string> } } }).Transaction;
      expect(tx.effects.gasUsed).toEqual({
        computationCost: "100",
        storageCost: "200",
        storageRebate: "50",
        nonRefundableStorageFee: "0",
      });
    });

    it("returns a FailedTransaction $kind with the extracted error on FAILURE", async () => {
      const { api } = stubApi({
        data: {
          simulateTransaction: {
            effects: {
              status: "FAILURE",
              effectsJson: { status: { error: { description: "InsufficientGas" } } },
            },
          },
        },
      });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.simulateTransaction({
        transaction: new Uint8Array([0]),
      } as never);
      expect((out as { $kind: string }).$kind).toBe("FailedTransaction");
      const status = (out as {
        FailedTransaction: { status: { Failure: { error: { message: string } } } };
      }).FailedTransaction.status;
      expect(status.Failure.error.message).toBe("InsufficientGas");
    });

    it("reports 'simulation returned no effects' when effects is missing entirely", async () => {
      const { api } = stubApi({ data: { simulateTransaction: { effects: null } } });
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.simulateTransaction({
        transaction: new Uint8Array([0]),
      } as never);
      expect((out as { $kind: string }).$kind).toBe("FailedTransaction");
      const status = (out as {
        FailedTransaction: { status: { Failure: { error: { message: string } } } };
      }).FailedTransaction.status;
      expect(status.Failure.error.message).toMatch(/no effects/);
    });

    it("accepts a Transaction-like input via its .build() method", async () => {
      const { api } = stubApi({
        data: { simulateTransaction: { effects: { status: "SUCCESS" } } },
      });
      const txLike = { build: jest.fn().mockResolvedValue(new Uint8Array([9, 9])) };
      const client = makeSuiClientFromGraphQL(api);
      const out = await client.core.simulateTransaction({ transaction: txLike } as never);
      expect((out as { $kind: string }).$kind).toBe("Transaction");
      expect(txLike.build).toHaveBeenCalled();
    });
  });

  describe("resolveTransactionPlugin", () => {
    it("returns undefined so the SDK falls back to coreClientResolveTransactionPlugin", () => {
      const { api } = stubApi();
      const client = makeSuiClientFromGraphQL(api);
      const plugin = (client.core as unknown as { resolveTransactionPlugin: () => unknown }).resolveTransactionPlugin();
      expect(plugin).toBeUndefined();
    });
  });

  describe("Proxy stub for unimplemented resolver methods", () => {
    it("throws a diagnostic error when an unknown method is called", () => {
      const { api } = stubApi();
      const client = makeSuiClientFromGraphQL(api);
      const fn = (client.core as unknown as Record<string, () => unknown>).someUnknownMethod;
      expect(typeof fn).toBe("function");
      expect(() => fn()).toThrow(/sui-client-adapter.*someUnknownMethod.*not implemented/);
    });
  });
});

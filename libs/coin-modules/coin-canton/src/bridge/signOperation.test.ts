import { BigNumber } from "bignumber.js";
import { CantonSigner, CantonPreparedTransaction } from "../types";
import { Transaction } from "../types";
import { craftTransaction } from "../common-logic";
import prepareTransferMock from "../test/prepare-transfer.json";
import { buildSignOperation } from "./signOperation";

jest.mock("../common-logic", () => {
  const actual = jest.requireActual("../common-logic");
  return {
    ...actual,
    craftTransaction: jest.fn(),
  };
});

const mockCraftTransaction = craftTransaction as jest.MockedFunction<typeof craftTransaction>;

class MockCantonSigner implements CantonSigner {
  async getAddress(path: string, display?: boolean) {
    return {
      publicKey: "mock-public-key",
      address: "mock-address",
      path,
    };
  }

  async signTransaction(
    path: string,
    data: CantonPreparedTransaction | { transactions: string[] },
  ) {
    if ("transactions" in data) {
      return `untyped-signature-${data.transactions.length}`;
    } else {
      return `prepared-transaction-signature-${data.damlTransaction.length}-${data.nodes.length}`;
    }
  }
}

describe("buildSignOperation", () => {
  const mockDeviceId = "test-device-id";
  const mockDerivationPath = "44'/6767'/0'/0'/0'";
  const mockPartyId = "alice::1220d466a5d96a3509736c821e25fe81fc8a73f226d92e57e94a65170e58b07fc08e";

  beforeEach(() => {
    jest.clearAllMocks();
    mockCraftTransaction.mockReset();
  });

  const mockAccount = {
    id: "js:2:canton_network:test-party-id:",
    freshAddress: "test-address",
    freshAddressPath: mockDerivationPath,
    xpub: "test-party-id",
    currency: {
      id: "canton_network",
    },
    cantonResources: {
      partyId: mockPartyId,
    },
  } as any;

  const mockTransaction: Transaction = {
    family: "canton",
    recipient: "bob::44444444444444444444444444444444444444444444444444444444444444444444",
    amount: new BigNumber("1000000"),
    tokenId: "Amulet",
    fee: new BigNumber("1000"),
    memo: "Test transaction",
  };

  it("should handle prepared transaction signing", async () => {
    // GIVEN
    const mockSigner = new MockCantonSigner();
    const mockSignerContext = jest.fn().mockImplementation(async (deviceId, callback) => {
      return await callback(mockSigner);
    });

    mockCraftTransaction.mockResolvedValue({
      nativeTransaction: {
        // @ts-expect-error fix types
        transaction: prepareTransferMock.transaction,
        metadata: prepareTransferMock.metadata,
      },
      serializedTransaction: "serialized-transaction",
      hash: "mock-hash",
    });

    const signOperation = buildSignOperation(mockSignerContext);

    // WHEN
    const result = await new Promise((resolve, reject) => {
      signOperation({
        account: mockAccount,
        deviceId: mockDeviceId,
        transaction: mockTransaction,
      }).subscribe({
        next: value => {
          if (value.type === "signed") {
            resolve(value);
          }
        },
        error: reject,
      });
    });

    // THEN
    expect(mockCraftTransaction).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect((result as any).signedOperation.signature).toContain("prepared-transaction-signature-");
  });
});

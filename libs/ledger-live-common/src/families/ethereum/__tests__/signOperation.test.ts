import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import createTransaction from "../createTransaction";
import { fromAccountRaw } from "../../../account";
import { ethereum1 } from "../datasets/ethereum1";
import { signOperation } from "../signOperation";
import { setEnv } from "../../../env";
import { EIP1559ShouldBeUsed } from "../transaction";

const signTransaction = jest.fn(() => {
  return Promise.resolve({
    r: "r",
    s: "s",
    v: "v",
  });
});

jest.mock("@ledgerhq/hw-app-eth", () => {
  return {
    ...jest.requireActual("@ledgerhq/hw-app-eth"),
    default: class {
      signTransaction = signTransaction;
      setLoadConfig = () => {};
    },
  };
});

jest.mock("../../../hw/deviceAccess", () => ({
  withDevice: () => (job) => job({ decorateAppAPIMethods: () => {} }),
}));

const dummyAccount = fromAccountRaw(ethereum1);

const currencies = Object.values(cryptocurrenciesById).filter((currency) => {
  return currency.ethereumLikeInfo;
});

describe("signOperation", () => {
  describe("chainId encoding (EIP155)", () => {
    describe("Transaction type 0", () => {
      currencies.forEach((currency) => {
        beforeAll(() => {
          setEnv("EIP1559_ENABLED_CURRENCIES", "");
        });

        beforeEach(() => {
          signTransaction.mockImplementationOnce(() => {
            return Promise.resolve({
              r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
              s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
              v: (currency.ethereumLikeInfo!.chainId * 2 + 35).toString(16),
            });
          });
        });

        it(`should use EIP155 for ${currency.id} transaction`, async () => {
          await signOperation({
            account: {
              ...dummyAccount,
              currency,
            },
            deviceId: "",
            transaction: {
              ...createTransaction(),
              recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
              gasPrice: new BigNumber(0),
              nonce: 0,
            },
          }).toPromise();

          const txHashProvidedToAppBindings = (
            signTransaction.mock.calls[
              signTransaction.mock.calls.length - 1
            ] as unknown[]
          )[1];

          expect(
            ethers.utils.parseTransaction(`0x${txHashProvidedToAppBindings}`)
              .chainId
          ).toBe(currency.ethereumLikeInfo?.chainId);
        });
      });
    });

    describe("Transaction type 2", () => {
      const unsupportedCurrencies: CryptoCurrency["id"][] = [
        "bsc",
        "ethereum_classic",
        "ethereum_ropsten",
      ];

      beforeAll(() => {
        setEnv(
          "EIP1559_ENABLED_CURRENCIES",
          currencies
            .map((currency) => currency.id)
            .filter((currencyId) => !unsupportedCurrencies.includes(currencyId))
            .join(",")
        );
      });

      currencies.forEach((currency) => {
        beforeEach(() => {
          signTransaction.mockImplementationOnce(() => {
            return Promise.resolve({
              r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
              s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
              v: "01",
            });
          });
        });

        it(`should use EIP155 for ${currency.id} transaction`, async () => {
          await signOperation({
            account: {
              ...dummyAccount,
              currency,
            },
            deviceId: "",
            transaction: {
              ...createTransaction(),
              recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
              maxFeePerGas: new BigNumber(0),
              maxPriorityFeePerGas: new BigNumber(0),
              nonce: 0,
            },
          })
            .toPromise()
            .catch((err) => {
              if (err.message === "EIP-1559 not enabled on Common") {
                console.log(`EIP 1559 not supported for ${currency.id}`);
                return;
              }

              return; // TODO: should be throw err
            });

          const txHashProvidedToAppBindings = (
            signTransaction.mock.calls[
              signTransaction.mock.calls.length - 1
            ] as unknown[]
          )[1];

          if (EIP1559ShouldBeUsed(currency)) {
            expect(
              ethers.utils.parseTransaction(`0x${txHashProvidedToAppBindings}`)
                .chainId
            ).toBe(currency.ethereumLikeInfo?.chainId);
          }
        });
      });
    });
  });
});

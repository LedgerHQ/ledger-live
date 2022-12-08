import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import {
  cryptocurrenciesById,
  getCryptoCurrencyById,
} from "@ledgerhq/cryptoassets/currencies";

import createTransaction from "../createTransaction";
import { fromAccountRaw } from "../../../account";
import { ethereum1 } from "../datasets/ethereum1";
import { signOperation } from "../signOperation";
import { setEnv } from "../../../env";

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
      it("Should use EIP155 for ethereum", async () => {
        setEnv("EIP1559_ENABLED_CURRENCIES", "ethereum");
        const currency = getCryptoCurrencyById("ethereum");
        signTransaction.mockImplementationOnce(() => {
          return Promise.resolve({
            r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
            s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
            v: "01",
          });
        });

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

      it("Should use EIP155 for ethereum_goerli", async () => {
        setEnv("EIP1559_ENABLED_CURRENCIES", "ethereum_goerli");
        const currency = getCryptoCurrencyById("ethereum_goerli");
        signTransaction.mockImplementationOnce(() => {
          return Promise.resolve({
            r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
            s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
            v: "01",
          });
        });

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

      it("Should use EIP155 for polygon", async () => {
        setEnv("EIP1559_ENABLED_CURRENCIES", "polygon");
        const currency = getCryptoCurrencyById("polygon");
        signTransaction.mockImplementationOnce(() => {
          return Promise.resolve({
            r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
            s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
            v: "01",
          });
        });

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
});

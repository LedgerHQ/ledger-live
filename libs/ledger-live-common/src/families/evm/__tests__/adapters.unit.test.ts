import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { findTokenById } from "@ledgerhq/cryptoassets";
import { encodeAccountId, encodeTokenAccountId } from "../../../account";
import {
  EtherscanERC20Event,
  EtherscanOperation,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "../types";
import {
  etherscanERC20EventToOperation,
  etherscanOperationToOperation,
  transactionToEthersTransaction,
} from "../adapters";

const testData = Buffer.from("testBufferString").toString("hex");
const eip1559Tx: EvmTransactionEIP1559 = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  maxFeePerGas: new BigNumber(10000),
  maxPriorityFeePerGas: new BigNumber(10000),
  type: 2,
};
const legacyTx: EvmTransactionLegacy = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  gasPrice: new BigNumber(10000),
  type: 0,
};

describe("EVM Family", () => {
  describe("adapters.ts", () => {
    describe("transactionToEthersTransaction", () => {
      it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
        const ethers1559Tx: ethers.Transaction = {
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 2,
          maxFeePerGas: ethers.BigNumber.from(10000),
          maxPriorityFeePerGas: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(eip1559Tx)).toEqual(ethers1559Tx);
      });

      it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
        const legacyEthersTx: ethers.Transaction = {
          to: "0xkvn",
          nonce: 0,
          gasLimit: ethers.BigNumber.from(21000),
          data: "0x" + testData,
          value: ethers.BigNumber.from(100),
          chainId: 1,
          type: 0,
          gasPrice: ethers.BigNumber.from(10000),
        };

        expect(transactionToEthersTransaction(legacyTx)).toEqual(
          legacyEthersTx
        );
      });
    });

    describe("etherscanOperationToOperation", () => {
      it("should convert a etherscan-like smart contract operation (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanOperation = {
          blockNumber: "14923692",
          timeStamp: "1654646570",
          hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
          nonce: "7",
          blockHash:
            "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
          transactionIndex: "27",
          from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
          to: "0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc",
          value: "0",
          gas: "6000000",
          gasPrice: "125521409858",
          isError: "0",
          txreceipt_status: "1",
          input:
            "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
          contractAddress: "",
          cumulativeGasUsed: "1977481",
          gasUsed: "57168",
          confirmations: "122471",
          methodId: "0xa9059cbb",
          functionName: "transfer(address _to, uint256 _value)",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
          derivationMode: "",
        });

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-FEES",
          hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
          accountId,
          blockHash:
            "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
          blockHeight: 14923692,
          recipients: ["0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC"],
          senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
          value: new BigNumber("7175807958762144"),
          fee: new BigNumber("7175807958762144"),
          date: new Date("2022-06-08T00:02:50.000Z"),
          transactionSequenceNumber: 7,
          type: "FEES",
          extra: {},
        };

        expect(etherscanOperationToOperation(accountId, etherscanOp)).toEqual(
          expectedOperation
        );
      });

      it("should convert a etherscan-like coin out operation (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanOperation = {
          blockNumber: "13807766",
          timeStamp: "1639544926",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          nonce: "11898499",
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          transactionIndex: "394",
          from: "0x829bd824b016326a401d083b33d092293333a830",
          to: "0x26e3fd2dec89bf645ba7b41c4ddfad8454ee6245",
          value: "143141441418750645",
          gas: "210000",
          gasPrice: "68363841693",
          isError: "0",
          txreceipt_status: "1",
          input: "0x",
          contractAddress: "",
          cumulativeGasUsed: "14788393",
          gasUsed: "21000",
          confirmations: "2582470",
          methodId: "0x",
          functionName: "",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x829BD824B016326A401d083B33D092293333A830",
          derivationMode: "",
        });

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x829BD824B016326A401d083B33D092293333A830:-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-OUT",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          accountId,
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          blockHeight: 13807766,
          recipients: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
          senders: ["0x829BD824B016326A401d083B33D092293333A830"],
          value: new BigNumber("143141441418750645").plus("1435640675553000"),
          fee: new BigNumber("1435640675553000"),
          date: new Date("2021-12-15T05:08:46.000Z"),
          transactionSequenceNumber: 11898499,
          type: "OUT",
          extra: {},
        };

        expect(etherscanOperationToOperation(accountId, etherscanOp)).toEqual(
          expectedOperation
        );
      });

      it("should convert a etherscan-like coin in operation (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanOperation = {
          blockNumber: "13807766",
          timeStamp: "1639544926",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          nonce: "11898499",
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          transactionIndex: "394",
          from: "0x26e3fd2dec89bf645ba7b41c4ddfad8454ee6245",
          to: "0x829bd824b016326a401d083b33d092293333a830",
          value: "143141441418750645",
          gas: "210000",
          gasPrice: "68363841693",
          isError: "0",
          txreceipt_status: "1",
          input: "0x",
          contractAddress: "",
          cumulativeGasUsed: "14788393",
          gasUsed: "21000",
          confirmations: "2582470",
          methodId: "0x",
          functionName: "",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x829BD824B016326A401d083B33D092293333A830",
          derivationMode: "",
        });

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x829BD824B016326A401d083B33D092293333A830:-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-IN",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          accountId,
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          blockHeight: 13807766,
          recipients: ["0x829BD824B016326A401d083B33D092293333A830"],
          senders: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
          value: new BigNumber("143141441418750645"),
          fee: new BigNumber("1435640675553000"),
          date: new Date("2021-12-15T05:08:46.000Z"),
          transactionSequenceNumber: 11898499,
          type: "IN",
          extra: {},
        };

        expect(etherscanOperationToOperation(accountId, etherscanOp)).toEqual(
          expectedOperation
        );
      });

      it("should convert a etherscan-like coin none operation (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanOperation = {
          blockNumber: "13807766",
          timeStamp: "1639544926",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          nonce: "11898499",
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          transactionIndex: "394",
          from: "0x6bfd74c0996f269bcece59191eff667b3dfd73b9",
          to: "0x02a357476a300c89ce27d7d4c7e57bbd2dd3f006",
          value: "143141441418750645",
          gas: "210000",
          gasPrice: "68363841693",
          isError: "0",
          txreceipt_status: "1",
          input: "0x",
          contractAddress: "",
          cumulativeGasUsed: "14788393",
          gasUsed: "21000",
          confirmations: "2582470",
          methodId: "0x",
          functionName: "",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x829BD824B016326A401d083B33D092293333A830",
          derivationMode: "",
        });

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x829BD824B016326A401d083B33D092293333A830:-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-NONE",
          hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
          accountId,
          blockHash:
            "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
          blockHeight: 13807766,
          recipients: ["0x02a357476A300c89Ce27D7D4C7E57Bbd2DD3f006"],
          senders: ["0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9"],
          value: new BigNumber("143141441418750645"),
          fee: new BigNumber("1435640675553000"),
          date: new Date("2021-12-15T05:08:46.000Z"),
          transactionSequenceNumber: 11898499,
          type: "NONE",
          extra: {},
        };

        expect(etherscanOperationToOperation(accountId, etherscanOp)).toEqual(
          expectedOperation
        );
      });
    });

    describe("etherscanERC20EventToOperation", () => {
      it("should return null for an unknown token", () => {
        const etherscanOp: EtherscanERC20Event = {
          blockNumber: "16240731",
          timeStamp: "1671717983",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          nonce: "53",
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb41",
          to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
          value: "2000000",
          tokenName: "USD Coin",
          tokenSymbol: "USDC",
          tokenDecimal: "6",
          transactionIndex: "65",
          gas: "79381",
          gasPrice: "24314367325",
          gasUsed: "65613",
          cumulativeGasUsed: "4557746",
          input: "deprecated",
          confirmations: "150032",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          derivationMode: "",
        });

        expect(etherscanERC20EventToOperation(accountId, etherscanOp)).toEqual(
          null
        );
      });

      it("should convert a etherscan-like usdc out event (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanERC20Event = {
          blockNumber: "16240731",
          timeStamp: "1671717983",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          nonce: "53",
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
          value: "2000000",
          tokenName: "USD Coin",
          tokenSymbol: "USDC",
          tokenDecimal: "6",
          transactionIndex: "65",
          gas: "79381",
          gasPrice: "24314367325",
          gasUsed: "65613",
          cumulativeGasUsed: "4557746",
          input: "deprecated",
          confirmations: "150032",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          derivationMode: "",
        });
        const tokenCurrency = findTokenById("ethereum/erc20/usd__coin");
        const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency!);

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd__coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-OUT",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          accountId: tokenAccountId,
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          blockHeight: 16240731,
          senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
          recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
          value: new BigNumber("2000000"),
          fee: new BigNumber("1595338583295225"),
          contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          date: new Date("2022-12-22T14:06:23.000Z"),
          transactionSequenceNumber: 53,
          type: "OUT",
          extra: {},
        };

        expect(etherscanERC20EventToOperation(accountId, etherscanOp)).toEqual({
          operation: expectedOperation,
          tokenCurrency,
        });
      });

      it("should convert a etherscan-like usdc in event (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanERC20Event = {
          blockNumber: "16240731",
          timeStamp: "1671717983",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          nonce: "53",
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          from: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          value: "2000000",
          tokenName: "USD Coin",
          tokenSymbol: "USDC",
          tokenDecimal: "6",
          transactionIndex: "65",
          gas: "79381",
          gasPrice: "24314367325",
          gasUsed: "65613",
          cumulativeGasUsed: "4557746",
          input: "deprecated",
          confirmations: "150032",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          derivationMode: "",
        });
        const tokenCurrency = findTokenById("ethereum/erc20/usd__coin");
        const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency!);

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd__coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-IN",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          accountId: tokenAccountId,
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          blockHeight: 16240731,
          senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
          recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
          value: new BigNumber("2000000"),
          fee: new BigNumber("1595338583295225"),
          contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          date: new Date("2022-12-22T14:06:23.000Z"),
          transactionSequenceNumber: 53,
          type: "IN",
          extra: {},
        };

        expect(etherscanERC20EventToOperation(accountId, etherscanOp)).toEqual({
          operation: expectedOperation,
          tokenCurrency,
        });
      });

      it("should convert a etherscan-like usdc none event (from their API) to a Ledger Live Operation", () => {
        const etherscanOp: EtherscanERC20Event = {
          blockNumber: "16240731",
          timeStamp: "1671717983",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          nonce: "53",
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          from: "0x6bfd74c0996f269bcece59191eff667b3dfd73b9",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          to: "0x02a357476a300c89ce27d7d4c7e57bbd2dd3f006",
          value: "2000000",
          tokenName: "USD Coin",
          tokenSymbol: "USDC",
          tokenDecimal: "6",
          transactionIndex: "65",
          gas: "79381",
          gasPrice: "24314367325",
          gasUsed: "65613",
          cumulativeGasUsed: "4557746",
          input: "deprecated",
          confirmations: "150032",
        };

        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "ethereum",
          xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          derivationMode: "",
        });
        const tokenCurrency = findTokenById("ethereum/erc20/usd__coin");
        const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency!);

        const expectedOperation: Operation = {
          id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd__coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-NONE",
          hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
          accountId: tokenAccountId,
          blockHash:
            "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
          blockHeight: 16240731,
          recipients: ["0x02a357476A300c89Ce27D7D4C7E57Bbd2DD3f006"],
          senders: ["0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9"],
          value: new BigNumber("2000000"),
          fee: new BigNumber("1595338583295225"),
          contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          date: new Date("2022-12-22T14:06:23.000Z"),
          transactionSequenceNumber: 53,
          type: "NONE",
          extra: {},
        };

        expect(etherscanERC20EventToOperation(accountId, etherscanOp)).toEqual({
          operation: expectedOperation,
          tokenCurrency,
        });
      });
    });
  });
});

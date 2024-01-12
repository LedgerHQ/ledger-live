import BigNumber from "bignumber.js";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Operation } from "@ledgerhq/types-live";
import { findTokenById } from "@ledgerhq/cryptoassets";
import {
  etherscanERC1155EventToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanInternalTransactionToOperations,
  etherscanOperationToOperations,
} from "../../../adapters";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../../../types";

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("etherscan", () => {
      describe("etherscanOperationToOperations", () => {
        it("should convert an etherscan-like smart contract creation operation (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "14923692",
            timeStamp: "1654646570",
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            nonce: "7",
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "",
            value: "0",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            input:
              "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
            contractAddress: "0x4969d9fd2542e71e6b3ea87be54ea9a736bcc4e9",
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
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            blockHeight: 14923692,
            recipients: [""],
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            value: new BigNumber("7175807958762144"),
            fee: new BigNumber("7175807958762144"),
            date: new Date("2022-06-08T00:02:50.000Z"),
            transactionSequenceNumber: 7,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "FEES",
            extra: {},
          };

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like smart contract operation (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "14923692",
            timeStamp: "1654646570",
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            nonce: "7",
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
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
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            blockHeight: 14923692,
            recipients: ["0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC"],
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            value: new BigNumber("7175807958762144"),
            fee: new BigNumber("7175807958762144"),
            date: new Date("2022-06-08T00:02:50.000Z"),
            transactionSequenceNumber: 7,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "FEES",
            extra: {},
          };

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin out operation (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "13807766",
            timeStamp: "1639544926",
            hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
            nonce: "11898499",
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
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
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
            blockHeight: 13807766,
            recipients: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
            senders: ["0x829BD824B016326A401d083B33D092293333A830"],
            value: new BigNumber("143141441418750645").plus("1435640675553000"),
            fee: new BigNumber("1435640675553000"),
            date: new Date("2021-12-15T05:08:46.000Z"),
            transactionSequenceNumber: 11898499,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "OUT",
            extra: {},
          };

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin in operation (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "13807766",
            timeStamp: "1639544926",
            hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
            nonce: "11898499",
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
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
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
            blockHeight: 13807766,
            recipients: ["0x829BD824B016326A401d083B33D092293333A830"],
            senders: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
            value: new BigNumber("143141441418750645"),
            fee: new BigNumber("1435640675553000"),
            date: new Date("2021-12-15T05:08:46.000Z"),
            transactionSequenceNumber: 11898499,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "IN",
            extra: {},
          };

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin none operation (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "13807766",
            timeStamp: "1639544926",
            hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
            nonce: "11898499",
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
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
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
            blockHeight: 13807766,
            recipients: ["0x02a357476A300c89Ce27D7D4C7E57Bbd2DD3f006"],
            senders: ["0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9"],
            value: new BigNumber("143141441418750645"),
            fee: new BigNumber("1435640675553000"),
            date: new Date("2021-12-15T05:08:46.000Z"),
            transactionSequenceNumber: 11898499,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "NONE",
            extra: {},
          };

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like self send coin operation (from their API) to 2 Ledger Live Operations", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "14923692",
            timeStamp: "1654646570",
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            nonce: "7",
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            value: "1000",
            gas: "21000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            input: "",
            contractAddress: "",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x",
            functionName: "",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            derivationMode: "",
          });

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-IN",
              hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
              accountId,
              blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
              blockHeight: 14923692,
              recipients: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              value: new BigNumber("1000"),
              fee: new BigNumber("7175807958762144"),
              date: new Date("2022-06-08T00:02:50.000Z"),
              transactionSequenceNumber: 7,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              type: "IN",
              extra: {},
            },
            {
              id: "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-OUT",
              hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
              accountId,
              blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
              blockHeight: 14923692,
              recipients: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              value: new BigNumber("7175807958763144"),
              fee: new BigNumber("7175807958762144"),
              date: new Date("2022-06-08T00:02:50.000Z"),
              transactionSequenceNumber: 7,
              hasFailed: false,
              nftOperations: [],
              subOperations: [],
              internalOperations: [],
              type: "OUT",
              extra: {},
            },
          ];

          expect(etherscanOperationToOperations(accountId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });
      });

      describe("etherscanERC20EventToOperations", () => {
        it("should return an empty array for an unknown token", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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

          expect(etherscanERC20EventToOperations(accountId, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like usdc out event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-OUT-i0",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            accountId: tokenAccountId,
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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

          expect(etherscanERC20EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like usdc in event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-IN-i0",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            accountId: tokenAccountId,
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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

          expect(etherscanERC20EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore an etherscan-like usdc none event (from their API) and return empty array", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
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

          expect(etherscanERC20EventToOperations(accountId, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like self usdc event (from their API) into 2 Ledger Live Operations", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
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

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-IN-i0",
              hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
              accountId: tokenAccountId,
              blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
              blockHeight: 16240731,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("2000000"),
              fee: new BigNumber("1595338583295225"),
              contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              date: new Date("2022-12-22T14:06:23.000Z"),
              transactionSequenceNumber: 53,
              type: "IN",
              extra: {},
            },
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-OUT-i0",
              hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
              accountId: tokenAccountId,
              blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
              blockHeight: 16240731,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("2000000"),
              fee: new BigNumber("1595338583295225"),
              contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              date: new Date("2022-12-22T14:06:23.000Z"),
              transactionSequenceNumber: 53,
              type: "OUT",
              extra: {},
            },
          ];

          expect(etherscanERC20EventToOperations(accountId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });
      });

      describe("etherscanER721EventToOperation", () => {
        it("should convert an etherscan-like erc721 nft out event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            nonce: "0",
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            contractAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
            to: "0x6975be450864c02b4613023c2152ee0743572325",
            tokenID: "202106",
            tokenName: "CryptoKitties",
            tokenSymbol: "CK",
            tokenDecimal: "0",
            transactionIndex: "81",
            gas: "158820",
            gasPrice: "40000000000",
            gasUsed: "60508",
            cumulativeGasUsed: "4880352",
            input: "deprecated",
            confirmations: "7990490",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x06012c8cf97BEaD5deAe237070F9587f8E7A266d+202106+ethereum-0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66-NFT_OUT-i0",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            accountId,
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            blockHeight: 4708120,
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6975BE450864c02B4613023C2152EE0743572325"],
            value: new BigNumber("1"),
            fee: new BigNumber("2420320000000000"),
            contract: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
            tokenId: "202106",
            standard: "ERC721",
            date: new Date("2017-12-10T11:58:38.000Z"),
            transactionSequenceNumber: 0,
            type: "NFT_OUT",
            extra: {},
          };

          expect(etherscanERC721EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like erc721 nft in event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            nonce: "0",
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            from: "0x6975be450864c02b4613023c2152ee0743572325",
            contractAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            tokenID: "202106",
            tokenName: "CryptoKitties",
            tokenSymbol: "CK",
            tokenDecimal: "0",
            transactionIndex: "81",
            gas: "158820",
            gasPrice: "40000000000",
            gasUsed: "60508",
            cumulativeGasUsed: "4880352",
            input: "deprecated",
            confirmations: "7990490",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x06012c8cf97BEaD5deAe237070F9587f8E7A266d+202106+ethereum-0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66-NFT_IN-i0",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            accountId,
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            blockHeight: 4708120,
            senders: ["0x6975BE450864c02B4613023C2152EE0743572325"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("1"),
            fee: new BigNumber("2420320000000000"),
            contract: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
            tokenId: "202106",
            standard: "ERC721",
            date: new Date("2017-12-10T11:58:38.000Z"),
            transactionSequenceNumber: 0,
            type: "NFT_IN",
            extra: {},
          };

          expect(etherscanERC721EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore an etherscan-like erc721 nft none event (from their API) and return empty array", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            nonce: "0",
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            from: "0x6975be450864c02b4613023c2152ee0743572325",
            contractAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
            to: "0x0000000000000000000000000000000000000000",
            tokenID: "202106",
            tokenName: "CryptoKitties",
            tokenSymbol: "CK",
            tokenDecimal: "0",
            transactionIndex: "81",
            gas: "158820",
            gasPrice: "40000000000",
            gasUsed: "60508",
            cumulativeGasUsed: "4880352",
            input: "deprecated",
            confirmations: "7990490",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          expect(etherscanERC721EventToOperations(accountId, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like erc721 nft event (from their API) into 2 Ledger Live Operations", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
            nonce: "0",
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            contractAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            tokenID: "202106",
            tokenName: "CryptoKitties",
            tokenSymbol: "CK",
            tokenDecimal: "0",
            transactionIndex: "81",
            gas: "158820",
            gasPrice: "40000000000",
            gasUsed: "60508",
            cumulativeGasUsed: "4880352",
            input: "deprecated",
            confirmations: "7990490",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x06012c8cf97BEaD5deAe237070F9587f8E7A266d+202106+ethereum-0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66-NFT_IN-i0",
              hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
              accountId,
              blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
              blockHeight: 4708120,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("1"),
              fee: new BigNumber("2420320000000000"),
              contract: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
              tokenId: "202106",
              standard: "ERC721",
              date: new Date("2017-12-10T11:58:38.000Z"),
              transactionSequenceNumber: 0,
              type: "NFT_IN",
              extra: {},
            },
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x06012c8cf97BEaD5deAe237070F9587f8E7A266d+202106+ethereum-0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66-NFT_OUT-i0",
              hash: "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66",
              accountId,
              blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
              blockHeight: 4708120,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("1"),
              fee: new BigNumber("2420320000000000"),
              contract: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
              tokenId: "202106",
              standard: "ERC721",
              date: new Date("2017-12-10T11:58:38.000Z"),
              transactionSequenceNumber: 0,
              type: "NFT_OUT",
              extra: {},
            },
          ];

          expect(etherscanERC721EventToOperations(accountId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });
      });

      describe("etherscanERC1155EventToOperations", () => {
        it("should convert a etherscan-like erc1155 nft out event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            nonce: "41",
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            transactionIndex: "100",
            gas: "140000",
            gasPrice: "52898577246",
            gasUsed: "105030",
            cumulativeGasUsed: "11739203",
            input: "deprecated",
            contractAddress: "0x76be3b62873462d2142405439777e971754e8e77",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x83f564d180b58ad9a02a449105568189ee7de8cb",
            tokenID: "10371",
            tokenValue: "1",
            tokenName: "parallel",
            tokenSymbol: "LL",
            confirmations: "1447769",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x76BE3b62873462d2142405439777e971754E8E77+10371+ethereum-0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d-NFT_OUT-i0_0",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            accountId,
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            blockHeight: 13472395,
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
            value: new BigNumber("1"),
            fee: new BigNumber("5555937568147380"),
            contract: "0x76BE3b62873462d2142405439777e971754E8E77",
            tokenId: "10371",
            standard: "ERC1155",
            date: new Date("2021-10-23T07:14:45.000Z"),
            transactionSequenceNumber: 41,
            type: "NFT_OUT",
            extra: {},
          };

          expect(etherscanERC1155EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like erc1155 nft in event (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            nonce: "41",
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            transactionIndex: "100",
            gas: "140000",
            gasPrice: "52898577246",
            gasUsed: "105030",
            cumulativeGasUsed: "11739203",
            input: "deprecated",
            contractAddress: "0x76be3b62873462d2142405439777e971754e8e77",
            from: "0x83f564d180b58ad9a02a449105568189ee7de8cb",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            tokenID: "10371",
            tokenValue: "1",
            tokenName: "parallel",
            tokenSymbol: "LL",
            confirmations: "1447769",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x76BE3b62873462d2142405439777e971754E8E77+10371+ethereum-0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d-NFT_IN-i0_0",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            accountId,
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            blockHeight: 13472395,
            senders: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("1"),
            fee: new BigNumber("5555937568147380"),
            contract: "0x76BE3b62873462d2142405439777e971754E8E77",
            tokenId: "10371",
            standard: "ERC1155",
            date: new Date("2021-10-23T07:14:45.000Z"),
            transactionSequenceNumber: 41,
            type: "NFT_IN",
            extra: {},
          };

          expect(etherscanERC1155EventToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore a etherscan-like erc1155 nft none event (from their API) and return empty array", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            nonce: "41",
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            transactionIndex: "100",
            gas: "140000",
            gasPrice: "52898577246",
            gasUsed: "105030",
            cumulativeGasUsed: "11739203",
            input: "deprecated",
            contractAddress: "0x76be3b62873462d2142405439777e971754e8e77",
            from: "0x83f564d180b58ad9a02a449105568189ee7de8cb",
            to: "0x0000000000000000000000000000000000000000",
            tokenID: "10371",
            tokenValue: "1",
            tokenName: "parallel",
            tokenSymbol: "LL",
            confirmations: "1447769",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          expect(etherscanERC1155EventToOperations(accountId, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like erc1155 nft event (from their API) into 2 Ledger Live Operations", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
            nonce: "41",
            blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
            transactionIndex: "100",
            gas: "140000",
            gasPrice: "52898577246",
            gasUsed: "105030",
            cumulativeGasUsed: "11739203",
            input: "deprecated",
            contractAddress: "0x76be3b62873462d2142405439777e971754e8e77",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            tokenID: "10371",
            tokenValue: "1",
            tokenName: "parallel",
            tokenSymbol: "LL",
            confirmations: "1447769",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x76BE3b62873462d2142405439777e971754E8E77+10371+ethereum-0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d-NFT_IN-i0_0",
              hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
              accountId,
              blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
              blockHeight: 13472395,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("1"),
              fee: new BigNumber("5555937568147380"),
              contract: "0x76BE3b62873462d2142405439777e971754E8E77",
              tokenId: "10371",
              standard: "ERC1155",
              date: new Date("2021-10-23T07:14:45.000Z"),
              transactionSequenceNumber: 41,
              type: "NFT_IN",
              extra: {},
            },
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x76BE3b62873462d2142405439777e971754E8E77+10371+ethereum-0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d-NFT_OUT-i0_0",
              hash: "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d",
              accountId,
              blockHash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
              blockHeight: 13472395,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("1"),
              fee: new BigNumber("5555937568147380"),
              contract: "0x76BE3b62873462d2142405439777e971754E8E77",
              tokenId: "10371",
              standard: "ERC1155",
              date: new Date("2021-10-23T07:14:45.000Z"),
              transactionSequenceNumber: 41,
              type: "NFT_OUT",
              extra: {},
            },
          ];

          expect(etherscanERC1155EventToOperations(accountId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });
      });

      describe("etherscanInternalTransactionToOperations", () => {
        it("should convert a etherscan-like out internal transaction (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
            value: "66616263350003",
            contractAddress: "",
            input: "",
            type: "call",
            gas: "129878",
            gasUsed: "0",
            traceId: "0_1",
            isError: "0",
            errCode: "",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885-OUT-i0",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            accountId,
            blockHeight: 14878012,
            blockHash: undefined,
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"],
            value: new BigNumber("66616263350003"),
            fee: new BigNumber("0"),
            date: new Date("2022-05-31T09:43:59.000Z"),
            type: "OUT",
            hasFailed: false,
            extra: {},
          };

          expect(etherscanInternalTransactionToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like in internal transaction (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            from: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "66616263350003",
            contractAddress: "",
            input: "",
            type: "call",
            gas: "129878",
            gasUsed: "0",
            traceId: "0_1",
            isError: "0",
            errCode: "",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885-IN-i0",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            accountId,
            blockHeight: 14878012,
            blockHash: undefined,
            senders: ["0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("66616263350003"),
            fee: new BigNumber("0"),
            date: new Date("2022-05-31T09:43:59.000Z"),
            type: "IN",
            hasFailed: false,
            extra: {},
          };

          expect(etherscanInternalTransactionToOperations(accountId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like none internal transaction (from their API) to a Ledger Live Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            from: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
            to: "0x3244100A07c7fEE9bDE409e877ed2e8Ff1EdeEda", // pdv.eth
            value: "66616263350003",
            contractAddress: "",
            input: "",
            type: "call",
            gas: "129878",
            gasUsed: "0",
            traceId: "0_1",
            isError: "0",
            errCode: "",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          expect(etherscanInternalTransactionToOperations(accountId, etherscanOp)).toEqual([]);
        });

        it("should convert a etherscan-like self internal transaction (from their API) to 2 Ledger Live Operations", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "66616263350003",
            contractAddress: "",
            input: "",
            type: "call",
            gas: "129878",
            gasUsed: "0",
            traceId: "0_1",
            isError: "0",
            errCode: "",
          };

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            derivationMode: "",
          });

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885-IN-i0",
              hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
              accountId,
              blockHeight: 14878012,
              blockHash: undefined,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("66616263350003"),
              fee: new BigNumber("0"),
              date: new Date("2022-05-31T09:43:59.000Z"),
              type: "IN",
              hasFailed: false,
              extra: {},
            },
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885-OUT-i0",
              hash: "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885",
              accountId,
              blockHeight: 14878012,
              blockHash: undefined,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("66616263350003"),
              fee: new BigNumber("0"),
              date: new Date("2022-05-31T09:43:59.000Z"),
              type: "OUT",
              hasFailed: false,
              extra: {},
            },
          ];

          expect(etherscanInternalTransactionToOperations(accountId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });
      });
    });
  });
});

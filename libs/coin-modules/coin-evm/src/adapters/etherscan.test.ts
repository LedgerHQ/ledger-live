import BigNumber from "bignumber.js";
import {
  etherscanERC1155EventToOperations,
  etherscanERC20EventToOperations,
  etherscanERC721EventToOperations,
  etherscanInternalTransactionToOperations,
  etherscanOperationToOperations,
  internalTxsToOperationsByHash,
  safeBigNumber,
  safeDate,
  deserializePagingToken,
  serializePagingToken,
} from "../adapters";
import { NO_TOKEN } from "../network/explorer/types";
import {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../types";

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("etherscan", () => {
      describe("etherscanOperationToOperations", () => {
        it("should convert an etherscan-like smart contract creation operation (from their API) to an Operation", () => {
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

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const expectedOperation = {
            id: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-FEES",
            type: "FEES",
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            recipients: ["0x4969D9fD2542e71e6b3EA87bE54EA9a736bcC4E9"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
              block: {
                height: 14923692,
                hash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
                time: new Date("2022-06-08T00:02:50.000Z"),
              },
              fees: 7175807958762144n,
              date: new Date("2022-06-08T00:02:50.000Z"),
              failed: false,
              feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
            },
            details: {
              sequence: "7",
              contractInteraction: "SmartContractDeployment",
              contractAddress: "0x4969D9fD2542e71e6b3EA87bE54EA9a736bcC4E9",
              contractPayload:
                "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
            },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like smart contract operation (from their API) to an Operation", () => {
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

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const expectedOperation = {
            id: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-FEES",
            type: "FEES",
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            recipients: ["0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
              block: {
                height: 14923692,
                hash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
                time: new Date("2022-06-08T00:02:50.000Z"),
              },
              fees: 7175807958762144n,
              date: new Date("2022-06-08T00:02:50.000Z"),
              failed: false,
              feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
            },
            details: {
              sequence: "7",
              contractInteraction: "SmartContractInteraction",
              contractAddress: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
              contractPayload:
                "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
            },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin out operation (from their API) to an Operation", () => {
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

          const address = "0x829BD824B016326A401d083B33D092293333A830";
          const currencyId = "ethereum";

          const expectedOperation = {
            id: "0x829BD824B016326A401d083B33D092293333A830-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-OUT",
            type: "OUT",
            senders: ["0x829BD824B016326A401d083B33D092293333A830"],
            recipients: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
            value: 143141441418750645n,
            asset: { type: "native" },
            tx: {
              hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
              block: {
                height: 13807766,
                hash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
                time: new Date("2021-12-15T05:08:46.000Z"),
              },
              fees: 1435640675553000n,
              date: new Date("2021-12-15T05:08:46.000Z"),
              failed: false,
              feesPayer: "0x829BD824B016326A401d083B33D092293333A830",
            },
            details: { sequence: "11898499" },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin in operation (from their API) to an Operation", () => {
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

          const address = "0x829BD824B016326A401d083B33D092293333A830";
          const currencyId = "ethereum";

          const expectedOperation = {
            id: "0x829BD824B016326A401d083B33D092293333A830-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-IN",
            type: "IN",
            senders: ["0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245"],
            recipients: ["0x829BD824B016326A401d083B33D092293333A830"],
            value: 143141441418750645n,
            asset: { type: "native" },
            tx: {
              hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
              block: {
                height: 13807766,
                hash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
                time: new Date("2021-12-15T05:08:46.000Z"),
              },
              fees: 1435640675553000n,
              date: new Date("2021-12-15T05:08:46.000Z"),
              failed: false,
              feesPayer: "0x26E3fd2dEc89bF645BA7b41c4DdFad8454Ee6245",
            },
            details: { sequence: "11898499" },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like coin none operation (from their API) to an Operation", () => {
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

          const address = "0x829BD824B016326A401d083B33D092293333A830";
          const currencyId = "ethereum";

          const expectedOperation = {
            id: "0x829BD824B016326A401d083B33D092293333A830-0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944-NONE",
            type: "NONE",
            senders: ["0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9"],
            recipients: ["0x02a357476A300c89Ce27D7D4C7E57Bbd2DD3f006"],
            value: 143141441418750645n,
            asset: { type: "native" },
            tx: {
              hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
              block: {
                height: 13807766,
                hash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
                time: new Date("2021-12-15T05:08:46.000Z"),
              },
              fees: 1435640675553000n,
              date: new Date("2021-12-15T05:08:46.000Z"),
              failed: false,
              feesPayer: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
            },
            details: { sequence: "11898499" },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like self send coin operation (from their API) to 2 Operations", () => {
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

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const selfSendTx = {
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            block: {
              height: 14923692,
              hash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
              time: new Date("2022-06-08T00:02:50.000Z"),
            },
            fees: 7175807958762144n,
            date: new Date("2022-06-08T00:02:50.000Z"),
            failed: false,
            feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
          };

          const expectedOperations = [
            {
              id: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-IN",
              type: "IN",
              senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              recipients: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              value: 1000n,
              asset: { type: "native" },
              tx: selfSendTx,
              details: { sequence: "7" },
            },
            {
              id: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e-0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338-OUT",
              type: "OUT",
              senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              recipients: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
              value: 1000n,
              asset: { type: "native" },
              tx: selfSendTx,
              details: { sequence: "7" },
            },
          ];

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual(
            expectedOperations,
          );
        });

        it("should return an operation with the expected amount", () => {
          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const etherscanOpFees: EtherscanOperation = {
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

          // Successful Op (value = transferred only; fee is separate; Ledger Wallet adds fee in bridge)
          expect(
            etherscanOperationToOperations(address, currencyId, etherscanOpFees)[0].value,
          ).toEqual(BigInt(etherscanOpFees.value));
          // Failing Op (value = tx value, same as success)
          expect(
            etherscanOperationToOperations(address, currencyId, {
              ...etherscanOpFees,
              isError: "1",
            })[0].value,
          ).toEqual(BigInt(etherscanOpFees.value));

          const etherscanOpOut: EtherscanOperation = {
            blockNumber: "13807766",
            timeStamp: "1639544926",
            hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
            nonce: "11898499",
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
            transactionIndex: "394",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
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

          // Successful Op (value = transferred only; fee is separate; Ledger Wallet adds fee in bridge)
          expect(
            etherscanOperationToOperations(address, currencyId, etherscanOpOut)[0].value,
          ).toEqual(BigInt(etherscanOpOut.value));
          // Failing Op (value = tx value, same as success)
          expect(
            etherscanOperationToOperations(address, currencyId, {
              ...etherscanOpOut,
              isError: "1",
            })[0].value,
          ).toEqual(BigInt(etherscanOpOut.value));

          const etherscanOpIn: EtherscanOperation = {
            blockNumber: "13807766",
            timeStamp: "1639544926",
            hash: "0x8d3e871469ce549c5a80b8c8beaae0d502ecea85bb43eb84703cebeea7d25944",
            nonce: "11898499",
            blockHash: "0xad04a8ed598c9c270f7ffd9a113224bc16fc285af814a2dc735c261620bad669",
            transactionIndex: "394",
            from: "0x26e3fd2dec89bf645ba7b41c4ddfad8454ee6245",
            to: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
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

          // Successful Op
          expect(
            etherscanOperationToOperations(address, currencyId, etherscanOpIn)[0].value,
          ).toEqual(BigInt(etherscanOpIn.value));
          // Failing Op
          expect(
            etherscanOperationToOperations(address, currencyId, {
              ...etherscanOpIn,
              isError: "1",
            })[0].value,
          ).toEqual(BigInt(etherscanOpIn.value));
        });

        // Raw response from Blockscout Optimism API for account 0xB10770cE9f8532634b6Ba156b8789f19935210F0
        // These transactions have empty gasPrice which previously caused "Cannot convert NaN to a BigInt"
        const rawBlockscoutTransaction: EtherscanOperation = {
          blockHash: "0x9856e4949b1854cca7463e29fe50d78c3f458b48b59402b765c4fa4b53292568",
          blockNumber: "117087839",
          confirmations: "29885597",
          contractAddress: "",
          cumulativeGasUsed: "381508",
          from: "0xb10770ce9f8532634b6ba156b8789f19935210f0",
          gas: "163840",
          gasPrice: "",
          gasUsed: "140669",
          hash: "0xea18d674a91c9b7459baad0e138bcca25fa342d8fa692c66489248a3ebb4ca9d",
          input:
            "0x22e147abe8919a070b6015d241b29a7bf065b2acd60b85d34fbd69a76171ab7a69b15fad2ffb299b366ffe43cbc46ec3f2e8f2b3e821df564be33fb5549a566e1c65e916a20223a20cdc42000000000000000000000000000000000000060a2c9a33c8dc6ff44d5d932cbd77b52e5612ba0529dc6226f13301002c9a33c82ae3d6096d8215ac2acddf30c60caa984ea5debe",
          isError: "0",
          methodId: "0x",
          nonce: "167946",
          timeStamp: "1709774455",
          to: "0xff153aaab90deb8d88c3e7e9e0737b03a5e8b93c",
          transactionIndex: "2",
          txreceipt_status: "1",
          value: "0",
          functionName: "",
        };

        it("should handle transaction with empty gasPrice without throwing (Blockscout Optimism)", () => {
          const address = "0xB10770cE9f8532634b6Ba156b8789f19935210F0";
          const currencyId = "optimism";

          const result = etherscanOperationToOperations(
            address,
            currencyId,
            rawBlockscoutTransaction,
          );

          expect(result).toHaveLength(1);
          expect(result[0].tx.fees).toEqual(0n);
          expect(result[0].value).toEqual(0n);
          expect(result[0].tx.hash).toBe(
            "0xea18d674a91c9b7459baad0e138bcca25fa342d8fa692c66489248a3ebb4ca9d",
          );
          expect(result[0].type).toBe("OUT");
        });

        it("should handle failed transaction with empty gasPrice", () => {
          const address = "0xB10770cE9f8532634b6Ba156b8789f19935210F0";
          const currencyId = "optimism";

          const failedTransaction: EtherscanOperation = {
            ...rawBlockscoutTransaction,
            isError: "1",
            txreceipt_status: "0",
            hash: "0xb7ae1fdaa0d0bcde82cdb12d91898862fbcc5308bc844f508916b434080bb218",
          };

          const result = etherscanOperationToOperations(address, currencyId, failedTransaction);

          expect(result).toHaveLength(1);
          expect(result[0].tx.fees).toEqual(0n);
          expect(result[0].value).toEqual(0n);
          expect(result[0].tx.failed).toBe(true);
        });

        it("should handle transaction with both empty gasPrice and empty value", () => {
          const address = "0xB10770cE9f8532634b6Ba156b8789f19935210F0";
          const currencyId = "optimism";

          const txWithEmptyValue: EtherscanOperation = {
            ...rawBlockscoutTransaction,
            value: "",
          };

          const result = etherscanOperationToOperations(address, currencyId, txWithEmptyValue);

          expect(result).toHaveLength(1);
          expect(result[0].tx.fees).toEqual(0n);
          expect(result[0].value).toEqual(0n);
        });

        it("should produce empty recipients when both to and contractAddress are empty strings", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "14923692",
            timeStamp: "1654646570",
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            nonce: "7",
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "",
            value: "1000",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            contractAddress: "",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x",
            functionName: "",
          };

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const result = etherscanOperationToOperations(address, currencyId, etherscanOp);

          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });

        it("should produce empty senders when from is an empty string", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "14923692",
            timeStamp: "1654646570",
            hash: "0xaa45b4858ba44230a5fce5a29570a5dec2bf1f0ba95bacdec4fe8f2c4fa99338",
            nonce: "7",
            blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
            transactionIndex: "27",
            from: "",
            to: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            value: "1000",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            contractAddress: "",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x",
            functionName: "",
          };

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "ethereum";

          const result = etherscanOperationToOperations(address, currencyId, etherscanOp);

          expect(result).toHaveLength(1);
          expect(result[0].senders).toEqual([]);
        });
      });

      describe("etherscanERC20EventToOperations", () => {
        it("should convert an etherscan-like usdc out event (from their API) to an Operation", () => {
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-erc20-0-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 2000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: {
              hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
              block: {
                height: 16240731,
                hash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
                time: new Date("2022-12-22T14:06:23.000Z"),
              },
              fees: 1595338583295225n,
              date: new Date("2022-12-22T14:06:23.000Z"),
              failed: false,
            },
            details: {
              sequence: "53",
              ledgerOpType: "OUT",
              assetAmount: "2000000",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            },
          };

          expect(etherscanERC20EventToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like usdc in event (from their API) to an Operation", () => {
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-erc20-0-IN",
            type: "IN",
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 2000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: {
              hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
              block: {
                height: 16240731,
                hash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
                time: new Date("2022-12-22T14:06:23.000Z"),
              },
              fees: 1595338583295225n,
              date: new Date("2022-12-22T14:06:23.000Z"),
              failed: false,
            },
            details: {
              sequence: "53",
              ledgerOpType: "IN",
              assetAmount: "2000000",
              assetSenders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(etherscanERC20EventToOperations(address, etherscanOp)).toEqual([
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          expect(etherscanERC20EventToOperations(address, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like self usdc event (from their API) into 2 Operations", () => {
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const sharedErc20Tx = {
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            block: {
              height: 16240731,
              hash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
              time: new Date("2022-12-22T14:06:23.000Z"),
            },
            fees: 1595338583295225n,
            date: new Date("2022-12-22T14:06:23.000Z"),
            failed: false,
          };

          const expectedOperations = [
            {
              id: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-erc20-0-IN",
              type: "IN",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 2000000n,
              asset: {
                type: "erc20",
                assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                assetOwner: address,
              },
              tx: sharedErc20Tx,
              details: {
                sequence: "53",
                ledgerOpType: "IN",
                assetAmount: "2000000",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
            {
              id: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf-erc20-0-OUT",
              type: "OUT",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 2000000n,
              asset: {
                type: "erc20",
                assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                assetOwner: address,
              },
              tx: sharedErc20Tx,
              details: {
                sequence: "53",
                ledgerOpType: "OUT",
                assetAmount: "2000000",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
          ];

          expect(etherscanERC20EventToOperations(address, etherscanOp)).toEqual(expectedOperations);
        });

        it("should handle ERC20 event with empty gasPrice (Blockscout Optimism)", () => {
          const address = "0xB10770cE9f8532634b6Ba156b8789f19935210F0";

          const erc20Event: EtherscanERC20Event = {
            blockNumber: "117087839",
            timeStamp: "1709774455",
            hash: "0xea18d674a91c9b7459baad0e138bcca25fa342d8fa692c66489248a3ebb4ca9d",
            nonce: "167946",
            blockHash: "0x9856e4949b1854cca7463e29fe50d78c3f458b48b59402b765c4fa4b53292568",
            from: "0xb10770ce9f8532634b6ba156b8789f19935210f0",
            to: "0xff153aaab90deb8d88c3e7e9e0737b03a5e8b93c",
            contractAddress: "0x4200000000000000000000000000000000000042",
            value: "1000000000000000000",
            tokenName: "Optimism",
            tokenSymbol: "OP",
            tokenDecimal: "18",
            transactionIndex: "2",
            gas: "163840",
            gasPrice: "",
            gasUsed: "140669",
            cumulativeGasUsed: "381508",
            input: "deprecated",
            confirmations: "29885597",
          };

          const result = etherscanERC20EventToOperations(address, erc20Event);

          expect(result).toHaveLength(1);
          expect(result[0].tx.fees).toEqual(0n);
          expect(result[0].value).toEqual(1000000000000000000n);
        });

        it("should produce empty recipients when to is an empty string", () => {
          const etherscanOp: EtherscanERC20Event = {
            blockNumber: "16240731",
            timeStamp: "1671717983",
            hash: "0x02b972f304dc24c9bc362e6435c4ad654241f9af916689a4790145c9bcbdf4cf",
            nonce: "53",
            blockHash: "0x58ee7556044cd139e569c87c173a6dedbfbeb9ada6693ee6090fd510acee9c21",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            to: "",
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const result = etherscanERC20EventToOperations(address, etherscanOp);

          expect(result).toHaveLength(1);
          result.forEach(op => expect(op.recipients).toEqual([]));
        });
      });

      describe("etherscanER721EventToOperation", () => {
        const erc721Hash = "0x031e6968a8de362e4328d60dcc7f72f0d6fc84284c452f63176632177146de66";
        const erc721Contract = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d";

        it("should convert an etherscan-like erc721 nft out event (from their API) to an Operation", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: erc721Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${erc721Hash}-erc721-0-NFT_OUT`,
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6975BE450864c02B4613023C2152EE0743572325"],
            value: 1n,
            asset: { type: "erc721", assetReference: erc721Contract, assetOwner: address },
            tx: {
              hash: erc721Hash,
              block: {
                height: 4708120,
                hash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
                time: new Date("2017-12-10T11:58:38.000Z"),
              },
              fees: 2420320000000000n,
              date: new Date("2017-12-10T11:58:38.000Z"),
              failed: false,
            },
            details: {
              sequence: "0",
              tokenId: "202106",
              ledgerOpType: "NFT_OUT",
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6975BE450864c02B4613023C2152EE0743572325"],
            },
          };

          expect(etherscanERC721EventToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like erc721 nft in event (from their API) to an Operation", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: erc721Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${erc721Hash}-erc721-0-NFT_IN`,
            type: "NFT_IN",
            senders: ["0x6975BE450864c02B4613023C2152EE0743572325"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc721", assetReference: erc721Contract, assetOwner: address },
            tx: {
              hash: erc721Hash,
              block: {
                height: 4708120,
                hash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
                time: new Date("2017-12-10T11:58:38.000Z"),
              },
              fees: 2420320000000000n,
              date: new Date("2017-12-10T11:58:38.000Z"),
              failed: false,
            },
            details: {
              sequence: "0",
              tokenId: "202106",
              ledgerOpType: "NFT_IN",
              assetAmount: "1",
              assetSenders: ["0x6975BE450864c02B4613023C2152EE0743572325"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(etherscanERC721EventToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore an etherscan-like erc721 nft none event (from their API) and return empty array", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: erc721Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          expect(etherscanERC721EventToOperations(address, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like erc721 nft event (from their API) into 2 Operations", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: erc721Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const sharedErc721Tx = {
            hash: erc721Hash,
            block: {
              height: 4708120,
              hash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
              time: new Date("2017-12-10T11:58:38.000Z"),
            },
            fees: 2420320000000000n,
            date: new Date("2017-12-10T11:58:38.000Z"),
            failed: false,
          };

          const expectedOperations = [
            {
              id: `${erc721Hash}-erc721-0-NFT_IN`,
              type: "NFT_IN",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 1n,
              asset: { type: "erc721", assetReference: erc721Contract, assetOwner: address },
              tx: sharedErc721Tx,
              details: {
                sequence: "0",
                tokenId: "202106",
                ledgerOpType: "NFT_IN",
                assetAmount: "1",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
            {
              id: `${erc721Hash}-erc721-0-NFT_OUT`,
              type: "NFT_OUT",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 1n,
              asset: { type: "erc721", assetReference: erc721Contract, assetOwner: address },
              tx: sharedErc721Tx,
              details: {
                sequence: "0",
                tokenId: "202106",
                ledgerOpType: "NFT_OUT",
                assetAmount: "1",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
          ];

          expect(etherscanERC721EventToOperations(address, etherscanOp)).toEqual(
            expectedOperations,
          );
        });

        it("should produce empty recipients when to is an empty string", () => {
          const etherscanOp: EtherscanERC721Event = {
            blockNumber: "4708120",
            timeStamp: "1512907118",
            hash: erc721Hash,
            nonce: "0",
            blockHash: "0x4be19c278bfaead5cb0bc9476fa632e2447f6e6259e0303af210302d22779a24",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            contractAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
            to: "",
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const result = etherscanERC721EventToOperations(address, etherscanOp);

          // from matches account → NFT_OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });

      describe("etherscanERC1155EventToOperations", () => {
        const erc1155Hash = "0x643b15f3ffaad5d38e33e5872b4ebaa7a643eda8b50ffd5331f682934ee65d4d";
        const erc1155Contract = "0x76BE3b62873462d2142405439777e971754E8E77";

        it("should convert a etherscan-like erc1155 nft out event (from their API) to an Operation", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: erc1155Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${erc1155Hash}-erc1155-0-NFT_OUT`,
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
            value: 1n,
            asset: { type: "erc1155", assetReference: erc1155Contract, assetOwner: address },
            tx: {
              hash: erc1155Hash,
              block: {
                height: 13472395,
                hash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
                time: new Date("2021-10-23T07:14:45.000Z"),
              },
              fees: 5555937568147380n,
              date: new Date("2021-10-23T07:14:45.000Z"),
              failed: false,
            },
            details: {
              sequence: "41",
              tokenId: "10371",
              ledgerOpType: "NFT_OUT",
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
            },
          };

          expect(etherscanERC1155EventToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like erc1155 nft in event (from their API) to an Operation", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: erc1155Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${erc1155Hash}-erc1155-0-NFT_IN`,
            type: "NFT_IN",
            senders: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc1155", assetReference: erc1155Contract, assetOwner: address },
            tx: {
              hash: erc1155Hash,
              block: {
                height: 13472395,
                hash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
                time: new Date("2021-10-23T07:14:45.000Z"),
              },
              fees: 5555937568147380n,
              date: new Date("2021-10-23T07:14:45.000Z"),
              failed: false,
            },
            details: {
              sequence: "41",
              tokenId: "10371",
              ledgerOpType: "NFT_IN",
              assetAmount: "1",
              assetSenders: ["0x83f564d180B58Ad9A02A449105568189eE7DE8CB"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(etherscanERC1155EventToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore a etherscan-like erc1155 nft none event (from their API) and return empty array", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: erc1155Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          expect(etherscanERC1155EventToOperations(address, etherscanOp)).toEqual([]);
        });

        it("should convert an etherscan-like erc1155 nft event (from their API) into 2 Operations", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: erc1155Hash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const sharedErc1155Tx = {
            hash: erc1155Hash,
            block: {
              height: 13472395,
              hash: "0xa5da536dfbe8125eb146114e2ee0d0bdef2b20483aacbf30fed6b60f092059e6",
              time: new Date("2021-10-23T07:14:45.000Z"),
            },
            fees: 5555937568147380n,
            date: new Date("2021-10-23T07:14:45.000Z"),
            failed: false,
          };

          const expectedOperations = [
            {
              id: `${erc1155Hash}-erc1155-0-NFT_IN`,
              type: "NFT_IN",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 1n,
              asset: { type: "erc1155", assetReference: erc1155Contract, assetOwner: address },
              tx: sharedErc1155Tx,
              details: {
                sequence: "41",
                tokenId: "10371",
                ledgerOpType: "NFT_IN",
                assetAmount: "1",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
            {
              id: `${erc1155Hash}-erc1155-0-NFT_OUT`,
              type: "NFT_OUT",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 1n,
              asset: { type: "erc1155", assetReference: erc1155Contract, assetOwner: address },
              tx: sharedErc1155Tx,
              details: {
                sequence: "41",
                tokenId: "10371",
                ledgerOpType: "NFT_OUT",
                assetAmount: "1",
                assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
                assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              },
            },
          ];

          expect(etherscanERC1155EventToOperations(address, etherscanOp)).toEqual(
            expectedOperations,
          );
        });

        it("should produce empty recipients when to is an empty string", () => {
          const etherscanOp: EtherscanERC1155Event = {
            blockNumber: "13472395",
            timeStamp: "1634973285",
            hash: erc1155Hash,
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
            to: "",
            tokenID: "10371",
            tokenValue: "1",
            tokenName: "parallel",
            tokenSymbol: "LL",
            confirmations: "1447769",
          };

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const result = etherscanERC1155EventToOperations(address, etherscanOp);

          // from matches account → NFT_OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });

      describe("etherscanInternalTransactionToOperations", () => {
        const internalHash = "0xb3effb3b6c52c719507f8219fe0dd2147a9f7ba366261ab43532efb0b9b01885";

        it("should convert a etherscan-like out internal transaction (from their API) to an Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: internalHash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${internalHash}-internal-0-OUT`,
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"],
            value: 66616263350003n,
            asset: { type: "native" },
            tx: {
              hash: internalHash,
              block: { height: 14878012, hash: "", time: new Date("2022-05-31T09:43:59.000Z") },
              fees: 0n,
              date: new Date("2022-05-31T09:43:59.000Z"),
              failed: false,
            },
            details: { internal: true },
          };

          expect(etherscanInternalTransactionToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like in internal transaction (from their API) to an Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: internalHash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const expectedOperation = {
            id: `${internalHash}-internal-0-IN`,
            type: "IN",
            senders: ["0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 66616263350003n,
            asset: { type: "native" },
            tx: {
              hash: internalHash,
              block: { height: 14878012, hash: "", time: new Date("2022-05-31T09:43:59.000Z") },
              fees: 0n,
              date: new Date("2022-05-31T09:43:59.000Z"),
              failed: false,
            },
            details: { internal: true },
          };

          expect(etherscanInternalTransactionToOperations(address, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a etherscan-like none internal transaction (from their API) to an Operation", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: internalHash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          expect(etherscanInternalTransactionToOperations(address, etherscanOp)).toEqual([]);
        });

        it("should convert a etherscan-like self internal transaction (from their API) to 2 Operations", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: internalHash,
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const sharedInternalTx = {
            hash: internalHash,
            block: { height: 14878012, hash: "", time: new Date("2022-05-31T09:43:59.000Z") },
            fees: 0n,
            date: new Date("2022-05-31T09:43:59.000Z"),
            failed: false,
          };

          const expectedOperations = [
            {
              id: `${internalHash}-internal-0-IN`,
              type: "IN",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 66616263350003n,
              asset: { type: "native" },
              tx: sharedInternalTx,
              details: { internal: true },
            },
            {
              id: `${internalHash}-internal-0-OUT`,
              type: "OUT",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 66616263350003n,
              asset: { type: "native" },
              tx: sharedInternalTx,
              details: { internal: true },
            },
          ];

          expect(etherscanInternalTransactionToOperations(address, etherscanOp)).toEqual(
            expectedOperations,
          );
        });

        it("should produce empty recipients when to is an empty string", () => {
          const etherscanOp: EtherscanInternalTransaction = {
            blockNumber: "14878012",
            timeStamp: "1653990239",
            hash: internalHash,
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "",
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

          const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";

          const result = etherscanInternalTransactionToOperations(address, etherscanOp);

          // from matches account → OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });

        // Blockscout reports `delegatecall`/`staticcall`/`callcode` internal frames with an
        // inherited `msg.value`, but those opcodes cannot move native ETH. Emitting operations
        // for them would surface phantom IN/OUT ops in the user's history.
        const addressForCallType = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";
        const makeInternalTx = (overrides: {
          type?: string;
          callType?: string;
        }): EtherscanInternalTransaction => ({
          blockNumber: "14878012",
          timeStamp: "1653990239",
          hash: internalHash,
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
          value: "66616263350003",
          contractAddress: "",
          input: "",
          type: overrides.type ?? "call",
          gas: "129878",
          gasUsed: "0",
          traceId: "0_1",
          isError: "0",
          errCode: "",
          ...(overrides.callType !== undefined ? { callType: overrides.callType } : {}),
        });

        it.each([
          { callType: "delegatecall" },
          { callType: "staticcall" },
          { callType: "callcode" },
          { type: "delegatecall" },
          { type: "staticcall" },
          { type: "callcode" },
        ])("returns no operations for non-value-transferring call type %o", overrides => {
          expect(
            etherscanInternalTransactionToOperations(addressForCallType, makeInternalTx(overrides)),
          ).toEqual([]);
        });

        it("is case-insensitive on the call type discriminator", () => {
          expect(
            etherscanInternalTransactionToOperations(
              addressForCallType,
              makeInternalTx({ callType: "DelegateCall" }),
            ),
          ).toEqual([]);
        });
      });

      describe("etherscanStakingToOperations", () => {
        const stakingHash = "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";
        const stakingBlockHash =
          "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282";
        const stakingDate = new Date(1694851200 * 1000);

        it("should convert an etherscan-like staking smart contract delegate operation (from their API) to an Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "12345678",
            timeStamp: "1694851200",
            hash: stakingHash,
            nonce: "7",
            blockHash: stakingBlockHash,
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "0x0000000000000000000000000000000000001005",
            value: "0",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            input:
              "0x9ddb511a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a73656976616c6f7065723178797a616263313233343536373839300000000000",
            contractAddress: "0x0000000000000000000000000000000000001005",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x9ddb511a",
            functionName: "delegate(string)",
          };

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "sei_evm";

          const expectedOperation = {
            id: `${address}-${stakingHash}-DELEGATE`,
            type: "DELEGATE",
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            recipients: ["0x0000000000000000000000000000000000001005"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: stakingHash,
              block: { height: 12345678, hash: stakingBlockHash, time: stakingDate },
              fees: 7175807958762144n,
              date: stakingDate,
              failed: false,
              feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
            },
            details: {
              sequence: "7",
              contractInteraction: "SmartContractInteraction",
              contractAddress: "0x0000000000000000000000000000000000001005",
              contractPayload:
                "0x9ddb511a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a73656976616c6f7065723178797a616263313233343536373839300000000000",
            },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like staking smart contract redelegate operation (from their API) to an Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "12345678",
            timeStamp: "1694851200",
            hash: stakingHash,
            nonce: "7",
            blockHash: stakingBlockHash,
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "0x0000000000000000000000000000000000001005",
            value: "0",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            input:
              "0x7dd0209d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a76616c696461746f723100000000000000000000000000000000000000000000000000000000000000000a76616c696461746f72320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e8",
            contractAddress: "0x0000000000000000000000000000000000001005",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x7dd0209d",
            functionName: "redelegate(string,string,uint256)",
          };

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "sei_evm";

          const expectedOperation = {
            id: `${address}-${stakingHash}-REDELEGATE`,
            type: "REDELEGATE",
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            recipients: ["0x0000000000000000000000000000000000001005"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: stakingHash,
              block: { height: 12345678, hash: stakingBlockHash, time: stakingDate },
              fees: 7175807958762144n,
              date: stakingDate,
              failed: false,
              feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
            },
            details: {
              sequence: "7",
              contractInteraction: "SmartContractInteraction",
              contractAddress: "0x0000000000000000000000000000000000001005",
              contractPayload:
                "0x7dd0209d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a76616c696461746f723100000000000000000000000000000000000000000000000000000000000000000a76616c696461746f72320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e8",
            },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert an etherscan-like staking smart contract undelegate operation (from their API) to an Operation", () => {
          const etherscanOp: EtherscanOperation = {
            blockNumber: "12345678",
            timeStamp: "1694851200",
            hash: stakingHash,
            nonce: "7",
            blockHash: stakingBlockHash,
            transactionIndex: "27",
            from: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            to: "0x0000000000000000000000000000000000001005",
            value: "0",
            gas: "6000000",
            gasPrice: "125521409858",
            isError: "0",
            txreceipt_status: "1",
            input: "0x8dfc88970000000000000000000000",
            contractAddress: "0x0000000000000000000000000000000000001005",
            cumulativeGasUsed: "1977481",
            gasUsed: "57168",
            confirmations: "122471",
            methodId: "0x8dfc8897",
            functionName: "redelegate(string,string,uint256)",
          };

          const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
          const currencyId = "sei_evm";

          const expectedOperation = {
            id: `${address}-${stakingHash}-UNDELEGATE`,
            type: "UNDELEGATE",
            senders: ["0x9AA99C23F67c81701C772B106b4F83f6e858dd2E"],
            recipients: ["0x0000000000000000000000000000000000001005"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: stakingHash,
              block: { height: 12345678, hash: stakingBlockHash, time: stakingDate },
              fees: 7175807958762144n,
              date: stakingDate,
              failed: false,
              feesPayer: "0x9AA99C23F67c81701C772B106b4F83f6e858dd2E",
            },
            details: {
              sequence: "7",
              contractInteraction: "SmartContractInteraction",
              contractAddress: "0x0000000000000000000000000000000000001005",
              contractPayload: "0x8dfc88970000000000000000000000",
            },
          };

          expect(etherscanOperationToOperations(address, currencyId, etherscanOp)).toEqual([
            expectedOperation,
          ]);
        });
      });

      describe("safeBigNumber", () => {
        it("should return BigNumber(0) for empty string", () => {
          expect(safeBigNumber("")).toEqual(new BigNumber(0));
        });
        it("should return BigNumber(0) for undefined", () => {
          expect(safeBigNumber(undefined)).toEqual(new BigNumber(0));
        });
        it("should return BigNumber(0) for NaN-producing values", () => {
          expect(safeBigNumber("not-a-number")).toEqual(new BigNumber(0));
          expect(safeBigNumber("abc")).toEqual(new BigNumber(0));
        });
        it("should return correct BigNumber for valid numeric strings", () => {
          expect(safeBigNumber("0")).toEqual(new BigNumber(0));
          expect(safeBigNumber("123")).toEqual(new BigNumber(123));
          expect(safeBigNumber("1000000000000000000")).toEqual(
            new BigNumber("1000000000000000000"),
          );
        });
        it("should handle hex values", () => {
          expect(safeBigNumber("0x10")).toEqual(new BigNumber(16));
        });
      });

      describe("safeDate", () => {
        it("parses a valid timeStamp (camelCase) string", () => {
          expect(safeDate({ timeStamp: "1654646570" })).toEqual(new Date(1654646570000));
        });
        it("parses a valid timestamp (lowercase) string as fallback", () => {
          expect(safeDate({ timestamp: "1654646570" })).toEqual(new Date(1654646570000));
        });
        it("prefers timeStamp over timestamp when both are present", () => {
          expect(safeDate({ timeStamp: "1654646570", timestamp: "0" })).toEqual(
            new Date(1654646570000),
          );
        });
        it("throws InvalidExplorerResponse when both fields are absent", () => {
          expect(() => safeDate({})).toThrow("Missing or non-numeric timestamp");
        });
        it("throws InvalidExplorerResponse when timeStamp is a non-numeric string", () => {
          expect(() => safeDate({ timeStamp: "not-a-number" })).toThrow(
            "Missing or non-numeric timestamp",
          );
        });
        it("throws InvalidExplorerResponse when timestamp (lowercase) is a non-numeric string", () => {
          expect(() => safeDate({ timestamp: "" })).toThrow("Missing or non-numeric timestamp");
        });
      });

      describe("internalTxsToOperationsByHash", () => {
        const baseInternalTx = {
          blockNumber: "100",
          timeStamp: "1635100060",
          hash: "0xtx1",
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
          value: "1000000000000000000",
          contractAddress: "",
          input: "",
          type: "call",
          gas: "21000",
          gasUsed: "21000",
          traceId: "0",
          isError: "0",
          errCode: "",
        };

        it("groups internal txs by hash and converts to native transfer operations", () => {
          const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "1000000000000000000" }];
          const byHash = internalTxsToOperationsByHash(internalTxs);
          expect(byHash.size).toBe(1);
          const ops = byHash.get("0xtx1")!;
          expect(ops).toHaveLength(2); // sender + receiver
          expect(ops.map(o => o.amount).sort()).toEqual([
            -1000000000000000000n,
            1000000000000000000n,
          ]);
          expect(ops.every(o => o.type === "transfer" && o.asset.type === "native")).toBe(true);
        });

        it("skips internal txs with isError === '1'", () => {
          const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", isError: "1", value: "1000" }];
          const byHash = internalTxsToOperationsByHash(internalTxs);
          expect(byHash.size).toBe(0);
        });

        it("skips internal txs with value === '0'", () => {
          const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "0" }];
          const byHash = internalTxsToOperationsByHash(internalTxs);
          expect(byHash.size).toBe(0);
        });

        it("returns empty map for empty internal txs array", () => {
          const byHash = internalTxsToOperationsByHash([]);
          expect(byHash.size).toBe(0);
        });

        it("accumulates multiple internal txs for the same tx hash", () => {
          const internalTxs = [
            { ...baseInternalTx, hash: "0xtx1", value: "1000", from: "0xa", to: "0xb" },
            { ...baseInternalTx, hash: "0xtx1", value: "2000", from: "0xc", to: "0xd" },
          ];
          const byHash = internalTxsToOperationsByHash(internalTxs);
          expect(byHash.size).toBe(1);
          expect(byHash.get("0xtx1")!.length).toBe(4); // 2 internal txs × 2 ops each
        });

        it.each(["delegatecall", "staticcall", "callcode"])(
          "skips internal txs whose Blockscout callType is %s (no native value moves)",
          callType => {
            const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", callType }];
            const byHash = internalTxsToOperationsByHash(internalTxs);
            expect(byHash.size).toBe(0);
          },
        );

        it.each(["delegatecall", "staticcall", "callcode"])(
          "skips internal txs whose Etherscan type is %s (no native value moves)",
          type => {
            const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", type }];
            const byHash = internalTxsToOperationsByHash(internalTxs);
            expect(byHash.size).toBe(0);
          },
        );
      });
    });

    describe("pagination helpers", () => {
      const allDone = {
        coinIsDone: true,
        internalIsDone: true,
        tokenIsDone: true,
        nftIsDone: true,
      };
      const noneDone = {
        coinIsDone: false,
        internalIsDone: false,
        tokenIsDone: false,
        nftIsDone: false,
      };

      describe("deserializePagingToken", () => {
        it("returns undefined when token is undefined", () => {
          expect(deserializePagingToken(undefined)).toBeUndefined();
        });

        it("returns undefined when token is NO_TOKEN (empty string)", () => {
          expect(deserializePagingToken("")).toBeUndefined();
        });

        it("throws when token is missing flags", () => {
          expect(() => deserializePagingToken("1000")).toThrow(
            "Invalid paging token: missing flags",
          );
        });

        it("throws when boundBlock is invalid", () => {
          expect(() => deserializePagingToken("abc-1111")).toThrow(
            "Invalid paging token: invalid boundBlock",
          );
        });

        it("throws when flags are invalid length", () => {
          expect(() => deserializePagingToken("1000-11")).toThrow(
            "Invalid paging token: invalid flags",
          );
        });

        it("deserializes token with all flags true (all done)", () => {
          expect(deserializePagingToken("1000-1111")).toEqual({
            boundBlock: 1000,
            coinIsDone: true,
            internalIsDone: true,
            tokenIsDone: true,
            nftIsDone: true,
          });
        });

        it("deserializes token with mixed flags", () => {
          expect(deserializePagingToken("1000-1010")).toEqual({
            boundBlock: 1000,
            coinIsDone: true,
            internalIsDone: false,
            tokenIsDone: true,
            nftIsDone: false,
          });
        });

        it("deserializes token with all flags false (none done)", () => {
          expect(deserializePagingToken("1000-0000")).toEqual({
            boundBlock: 1000,
            coinIsDone: false,
            internalIsDone: false,
            tokenIsDone: false,
            nftIsDone: false,
          });
        });
      });

      describe("serializePagingToken", () => {
        it("returns NO_TOKEN when all endpoints are done", () => {
          expect(serializePagingToken(1000, allDone)).toBe(NO_TOKEN);
        });

        it("returns NO_TOKEN when boundBlock is undefined", () => {
          expect(serializePagingToken(undefined, noneDone)).toBe(NO_TOKEN);
        });

        it("returns token with all flags false (none done)", () => {
          expect(serializePagingToken(1000, noneDone)).toBe("1000-0000");
        });

        it("returns token with mixed flags", () => {
          expect(
            serializePagingToken(1000, {
              coinIsDone: true,
              internalIsDone: false,
              tokenIsDone: true,
              nftIsDone: false,
            }),
          ).toBe("1000-1010");
        });

        it("returns token with only coin done", () => {
          expect(
            serializePagingToken(1000, {
              coinIsDone: true,
              internalIsDone: false,
              tokenIsDone: false,
              nftIsDone: false,
            }),
          ).toBe("1000-1000");
        });

        it("returns token with no flags done", () => {
          expect(serializePagingToken(500, noneDone)).toBe("500-0000");
        });
      });
    });
  });
});

import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { Transaction } from "./types";
import type { DatasetTest } from "@ledgerhq/types-live";

const dataset: DatasetTest<Transaction> = {
	implementations: ["js"],
	currencies: {
		zilliqa: {
			scanAccounts: [
				{
					name: "zilliqa seed 1",
					apdus: `
      => e001000000
      <= 0004029000
      => e00200000c000000800000008000000080
      <= 03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc77a696c313335796b6e346d683630383077327577773671617436766165646e7170327633706b356571649000
      => e001000000
      <= 0004029000
      => e00200000c010000800000008000000080
      <= 02d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab87a696c3164746d6b70636c33306566356a66303665377163656c64366a79686a326c70786468726375639000
      => e001000000
      <= 0004029000
      => e00200000c020000800000008000000080
      <= 036c39ae31ef7c4f668a93c0f6343926ab9e635f16fcf6cd30a0ec659d67e7e6f37a696c31676e3732373971363672773538346633717a3675616a7a756b63723576386a666778343232779000
      `,
				},
			],

			accounts: [
				{
					raw: {
						id:
							"js:2:zilliqa:zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc:zilliqaL",
						seedIdentifier:
							"03fa3bee864530094c637994bd08b45eb1d96e8f3c03e866bc18c7f6b06be15fc7",
						name: "Zilliqa 2",
						starred: false,
						used: true,
						derivationMode: "zilliqaL",
						index: 1,
						freshAddress:
							"zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc",
						freshAddressPath: "44'/313'/1'/0'/0'",
						freshAddresses: [
							{
								address:
									"zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc",
								derivationPath: "44'/313'/1'/0'/0'",
							},
						],
						blockHeight: 2559763,
						syncHash: undefined,
						creationDate: "2023-01-06T13:03:33.794Z",
						operationsCount: 0,
						operations: [],
						pendingOperations: [],
						currencyId: "zilliqa",
						unitMagnitude: 12,
						lastSyncDate: "2023-01-06T13:03:33.794Z",
						balance: "91870000000000",
						spendableBalance: "91870000000000",

						swapHistory: [],
					},
					transactions: [],
				},
			],
		},
	},
};

testBridge(dataset);

/* eslint-disable @typescript-eslint/triple-slash-reference */
/* eslint-disable no-var */
/// <reference path=".//global.d.ts" />
import type { Subject } from "rxjs";
import type { Server, WebSocket } from "ws";
import type { Application } from "@e2e/page/index";
import type { MessageData, ServerData } from "@ledgerhq/live-e2e-shared/bridge/types";
import type expect from "expect";
import type {
  $TmsLink as $TmsLinkType,
  Step as StepType,
  $Tag as $TagType,
  $Owner as $OwnerType,
  $ParentSuite as $ParentSuiteType,
} from "jest-allure2-reporter/api";
import { Currency as CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Delegate as DelegateType } from "@ledgerhq/live-e2e-shared/models/Delegate";
import {
  Account as AccountType,
  TokenAccount as TokenAccountType,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction as TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Fee as FeeType } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { AppInfos as AppInfosType } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Swap as SwapType } from "@ledgerhq/live-e2e-shared/models/Swap";
import { CLI as CLIType } from "@e2e/utils/cliUtils";
import type { OptionalFeatureMap } from "@shared/feature-flags";

declare global {
  var IS_FAILED: boolean;
  var speculosDevices: Map<string, number>;
  var speculosStartupErrorMessage: string | undefined;
  var speculosFailureStderr: string | undefined;
  var speculosFailedRunIds: Set<string> | undefined;
  var mergedFeatureFlags: OptionalFeatureMap | undefined;
  var webSocket: {
    wss: Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };

  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;

  var app: Application;
  var Step: typeof StepType;
  var $TmsLink: typeof $TmsLinkType;
  var $Tag: typeof $TagType;
  var $Owner: typeof $OwnerType;
  var $ParentSuite: typeof $ParentSuiteType;
  var CLI: typeof CLIType;
  var jestExpect: typeof expect;
  var Currency: typeof CurrencyType;
  var Delegate: typeof DelegateType;
  var Account: typeof AccountType;
  var TokenAccount: typeof TokenAccountType;
  var Transaction: typeof TransactionType;
  var Fee: typeof FeeType;
  var AppInfos: typeof AppInfosType;
  var Swap: typeof SwapType;

  var getAccountAddress: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").getAccountAddress;
  var liveDataCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").liveDataCommand;
  var liveDataWithAddressCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").liveDataWithAddressCommand;
  var liveDataWithParentAddressCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").liveDataWithParentAddressCommand;
  var liveDataWithRecipientAddressCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").liveDataWithRecipientAddressCommand;
  var parseTokenAllowanceCliOutput: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").parseTokenAllowanceCliOutput;
  var isTokenAllowanceSufficientCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").isTokenAllowanceSufficientCommand;
  var getTokenAllowanceCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").getTokenAllowanceCommand;
  var approveTokenCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").approveTokenCommand;
  var revokeTokenCommand: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").revokeTokenCommand;
  var setDisableTransactionBroadcastEnv: typeof import("@ledgerhq/live-e2e-shared/cliCommandsUtils").setDisableTransactionBroadcastEnv;
}

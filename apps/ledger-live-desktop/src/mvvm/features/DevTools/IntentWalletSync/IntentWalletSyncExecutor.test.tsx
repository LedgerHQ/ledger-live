import React from "react";
import { render, waitFor } from "tests/testSetup";
import { createIntent } from "@features/platform-device-intent";
import type {
  AddMemberIntent,
  AddMemberIntentInput,
  RemoveMemberIntent,
  RemoveMemberIntentInput,
} from "@features/platform-intent-wallet-sync";
import type { IntentWalletSyncRun } from "@devtools/bindings";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import { addMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../../WalletSync/deviceIntents/removeMemberIntent/intentLWDDefinition";
import { IntentWalletSyncExecutor } from "./IntentWalletSyncExecutor";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const MEMBER_CREDENTIALS = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN = { rootId: "root", applicationPath: "m/0'/16'/0'", walletSyncEncryptionKey: "k" };

const addMemberInput: AddMemberIntentInput = {
  memberCredentials: MEMBER_CREDENTIALS,
  createSessionSdk: jest.fn(),
};
const removeMemberInput: RemoveMemberIntentInput = {
  trustchain: TRUSTCHAIN,
  memberCredentials: MEMBER_CREDENTIALS,
  member: { id: "member-2", name: "Mobile", permissions: 1 },
  createSessionSdk: jest.fn(),
};
const addMemberIntent: AddMemberIntent = createIntent(addMemberIntentLWDDefinition, addMemberInput);
const removeMemberIntent: RemoveMemberIntent = createIntent(
  removeMemberIntentLWDDefinition,
  removeMemberInput,
);

const runs: IntentWalletSyncRun[] = [
  { operation: "add-member", intent: addMemberIntent },
  { operation: "remove-member", intent: removeMemberIntent },
];

describe("IntentWalletSyncExecutor", () => {
  beforeEach(() => {
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue({} as never);
  });

  it("should mount no executor while the devtool is idle", () => {
    render(<IntentWalletSyncExecutor run={null} onUserCancel={jest.fn()} />);

    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });

  it.each(runs)("should mount the app executor for $operation", async run => {
    const onUserCancel = jest.fn();

    render(<IntentWalletSyncExecutor run={run} onUserCancel={onUserCancel} />);

    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      sourceFlow: "ledger_sync",
      intent: run.intent,
      onUserCancel,
    });
  });
});

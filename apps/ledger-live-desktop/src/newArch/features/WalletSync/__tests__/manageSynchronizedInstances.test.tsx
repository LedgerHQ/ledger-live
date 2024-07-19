import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";

import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { mockedSdk, simpleTrustChain, walletSyncActivatedState } from "../testHelper/helper";

const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);

const INSTANCES: Array<TrustchainMember> = [
  {
    id: "currentInstance",
    name: "macOS",
    permissions: 112,
  },
  {
    id: "2",
    name: "Ipone 15",
    permissions: 112,
  },
];

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getMembers: (mockedSdk.getMembers = jest.fn()),
    removeMember: (mockedSdk.removeMember = jest.fn()),
  }),
}));

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({
    isMembersLoading: false,
    instances: INSTANCES,
    isError: false,
  }),
}));

jest.mock("@tanstack/react-query", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@tanstack/react-query"),
  };
});

describe("manageSynchronizedInstances", () => {
  it("should open drawer and display Wallet Sync ManageSynchronizedInstances flow, try delete current instance, handle exception and delete your instance", async () => {
    const { user } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: {
          ...walletSyncActivatedState,
          instances: INSTANCES,
        },
        trustchain: {
          trustchain: simpleTrustChain,
          memberCredentials: {
            pubkey: "currentInstance",
            privatekey: "privatekey",
          },
        },
      },
    });

    //Open drawer
    const button = screen.getByRole("button", { name: "Manage" });
    await user.click(button);

    const row = screen.getByTestId("walletSync-manage-instances");

    await waitFor(() => expect(row).toBeDefined());

    expect(screen.getByText("2 Synchronized instances")).toBeDefined();

    await user.click(row);

    //Manage Synch Instances Step

    await waitFor(() => expect(screen.getByText("Manage synchronized instances")).toBeDefined());

    const instance = screen.getByTestId("walletSync-manage-instance-currentInstance");
    expect(instance).toBeDefined();

    await user.click(screen.getAllByText("Remove")[0]);

    // Auto remove check handled
    expect(screen.getByText(/You can’t remove the current instance/i)).toBeDefined();

    await user.click(
      screen.getByRole("button", {
        name: "I understand",
      }),
    );

    const myInstance = screen.getByTestId("walletSync-manage-instance-2");
    expect(myInstance).toBeDefined();

    await user.click(screen.getAllByText("Remove")[1]);

    // NEED TO FAKE DEVICE ACTION
    // await waitFor(() =>
    //   expect(screen.getByText(`Your ${INSTANCES[1]} is no longer synchronized`)).toBeDefined(),
    // );
  });
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { initialStateWalletSync } from "~/renderer/reducers/walletSync";

const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

describe("manageSynchronizedInstances", () => {
  it("should open drawer and display Wallet Sync ManageSynchronizedInstances flow and delete your instance", async () => {
    const { user } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: {
          ...initialStateWalletSync,
          activated: true,
          instances: [
            {
              id: "1",
              name: "macOS",
              typeOfDevice: "desktop",
            },
            {
              id: "2",
              name: "Ipone 15",
              typeOfDevice: "mobile",
            },
          ],
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

    const instance = screen.getByTestId("walletSync-manage-instance-2");
    expect(instance).toBeDefined();

    await user.click(screen.getAllByText("Remove")[1]);

    //Need to fake device action
  });
});

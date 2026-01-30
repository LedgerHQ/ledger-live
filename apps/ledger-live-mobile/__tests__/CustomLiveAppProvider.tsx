import React from "react";
import { liveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { LiveAppContextType } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/types";
import type { ReactNode } from "react";

const mockInitialState: LiveAppManifest[] = [
  {
    id: "mock-live-app",
    name: "Mock Live App",
    url: "https://mock-live-app.com",
    apiVersion: "^2.0.0",
    manifestVersion: "2",
    currencies: ["ethereum", "ethereum/**", "ethereum/erc20/usd__coin"],
    permissions: ["account.request"],
    domains: ["https://"],
  } as LiveAppManifest,
  {
    id: "mock-dapp-v1",
    name: "Mock dapp browser v1 app",
    apiVersion: "^1.0.0 || ~0.0.1",
    manifestVersion: "2",
    params: {
      dappUrl: "https://mockapp.com",
      nanoApp: "",
      dappName: "",
      networks: [
        {
          currency: "ethereum",
          chainID: 1,
          nodeURL: "https://eth-dapps.api.live.ledger.com",
        },
      ],
    },
  } as LiveAppManifest,
  {
    id: "mock-dapp-v3",
    name: "Mock Dapp v3",
    url: "https://mockdapp.com?embed=true",
    apiVersion: "^2.0.0",
    manifestVersion: "2",
    dapp: {
      provider: "evm",
      networks: [
        {
          currency: "ethereum",
          chainID: 1,
          nodeURL: "https://eth-dapps.api.live.ledger.com",
        },
      ],
    },
  } as LiveAppManifest,
  {
    id: "earn",
    name: "Mock Earn Live App",
    url: "https://earn-live-app.com",
    apiVersion: "^2.0.0",
    manifestVersion: "2",
    currencies: ["ethereum", "ethereum/**"],
    permissions: ["account.request"],
    domains: ["https://"],
  } as LiveAppManifest,
];

const mockLiveAppContext: LiveAppContextType = {
  state: mockInitialState,
  addLocalManifest: jest.fn(),
  removeLocalManifestById: jest.fn(),
  getLocalLiveAppManifestById: jest.fn(id => mockInitialState.find(app => app.id === id)),
};

const CustomWrapper = ({ children }: { children: ReactNode }) => (
  <liveAppContext.Provider value={mockLiveAppContext}>{children}</liveAppContext.Provider>
);

export default CustomWrapper;

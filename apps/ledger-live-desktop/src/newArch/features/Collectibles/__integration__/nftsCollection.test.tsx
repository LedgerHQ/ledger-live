/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import { NftCollectionTest, NoNftCollectionTest } from "./shared";
import { account } from "./mocks/mockedAccount";
import { openURL } from "~/renderer/linking";

jest.mock(
  "electron",
  () => ({
    ipcRenderer: {
      on: jest.fn(),
      send: jest.fn(),
      invoke: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("NFT Collections Display", () => {
  const setupTest = (Component: typeof NftCollectionTest | typeof NoNftCollectionTest) => {
    return render(<Component />, {
      initialState: { accounts: [account] },
      initialRoute: "/",
    });
  };

  describe("when NFTs exist", () => {
    it("should display NFT collections with all necessary buttons", async () => {
      setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });

      expect(screen.getByText(/receive nft/i)).toBeVisible();
      expect(screen.getByText(/see gallery/i)).toBeVisible();
      expect(screen.getByText(/see more collections/i)).toBeVisible();
    });

    it("should navigate to NFTs gallery when clicking 'See Gallery'", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });

      await user.click(screen.getByText(/see gallery/i));
      expect(screen.getByText(/all nft/i)).toBeVisible();
    });

    it("should open NFT in OpenSea", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));
      await user.click(screen.getByTestId("external-viewer-button"));

      await user.click(screen.getByText(/open in opensea.io/i));
      expect(openURL).toHaveBeenCalledWith(
        "https://opensea.io/assets/ethereum/0x92e64d1a27f4f42ecaf0ef7f725f119751113a38/564",
      );
    });

    it("should open NFT in Rarible", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));
      await user.click(screen.getByTestId("external-viewer-button"));

      await user.click(screen.getByText(/open in rarible/i));
      expect(openURL).toHaveBeenCalledWith(
        "https://rarible.com/token/0x92e64d1a27f4f42ecaf0ef7f725f119751113a38:564",
      );
    });

    it("should open NFT in Explorer", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));
      await user.click(screen.getByTestId("external-viewer-button"));

      await user.click(screen.getByText(/open in explorer/i));
      expect(openURL).toHaveBeenCalledWith(
        "https://etherscan.io/nft/0x92e64d1a27f4f42ecaf0ef7f725f119751113a38/564",
      );
    });

    it("should display all the wanted informations correctly inside the drawer", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));

      expect(screen.getByText(/properties/i)).toBeVisible();
      expect(screen.getByText(/description/i)).toBeVisible();
      expect(screen.getByText(/token address/i)).toBeVisible();
      expect(screen.getByText(/token id/i)).toBeVisible();
    });

    it("should open and close NFT detail drawer correctly", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));
      await screen.findByTestId("side-drawer-container");

      await user.click(screen.getByTestId("drawer-close-button"));
      expect(screen.queryByTestId("side-drawer-container")).toBeNull();
    });

    it("should close the drawer on send", async () => {
      const { user } = setupTest(NftCollectionTest);

      await waitFor(() => {
        expect(screen.getByText(/momentum/i)).toBeVisible();
      });
      await user.click(screen.getByText(/momentum/i));
      await waitFor(() => {
        expect(screen.getByText(/ID: 35/i)).toBeVisible();
      });

      await user.click(screen.getByText(/ID: 35/i));
      await screen.findByTestId("side-drawer-container");

      const sendButtons = screen.getAllByText(/send/i);
      await user.click(sendButtons[0]);

      expect(screen.queryByTestId("side-drawer-container")).toBeNull();
    });
  });

  describe("when no NFTs exist", () => {
    it("should display empty state with appropriate buttons", async () => {
      setupTest(NoNftCollectionTest);

      expect(screen.getByText(/receive nft/i)).toBeVisible();
      expect(screen.getByText(/learn more/i)).toBeVisible();
    });
  });
});

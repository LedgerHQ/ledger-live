import React from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { render, screen } from "tests/testSetup";
import {
  ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY,
  ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY,
  accountChainPageKey,
  assetChainPageKey,
  readAssetAccountChainDepth,
  useAssetAccountChainNavigate,
} from "../assetAccountChain";

const BackButton = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>back</button>;
};

/** Asset page: `hop` opens the next numbered account, the other buttons open account X. */
const AssetPage = () => {
  const navigateInChain = useAssetAccountChainNavigate();
  const { "*": id = "" } = useParams<{ "*": string }>();
  const openAccount = (path: string, mainAccountId: string) =>
    navigateInChain(path, {
      from: assetChainPageKey(id),
      to: accountChainPageKey(mainAccountId),
      state: { origin: "test" },
    });
  return (
    <>
      <button onClick={() => openAccount(`/account/${Number(id) + 1}`, String(Number(id) + 1))}>
        hop
      </button>
      <button onClick={() => openAccount("/account/X", "X")}>to account X</button>
      <button onClick={() => openAccount("/account/X/token-X", "X")}>to token of X</button>
      <BackButton />
    </>
  );
};

/** Account page: `hop` opens the next numbered asset, the other buttons open assets A and B. */
const AccountPage = () => {
  const navigateInChain = useAssetAccountChainNavigate();
  const { id = "" } = useParams<{ id: string }>();
  const openAsset = (assetId: string) =>
    navigateInChain(`/asset/${assetId}`, {
      from: accountChainPageKey(id),
      to: assetChainPageKey(assetId),
    });
  return (
    <>
      <button onClick={() => openAsset(String(Number(id) + 1))}>hop</button>
      <button onClick={() => openAsset("A")}>to asset A</button>
      <button onClick={() => openAsset("B")}>to asset B</button>
      <BackButton />
    </>
  );
};

const LocationProbe = () => {
  const { pathname, state } = useLocation();
  return (
    <>
      <output data-testid="path">{pathname}</output>
      <output data-testid="state">{JSON.stringify(state)}</output>
    </>
  );
};

function renderChain(firstAsset: string) {
  return render(
    <MemoryRouter initialEntries={["/entry", `/asset/${firstAsset}`]} initialIndex={1}>
      <Routes>
        <Route path="/entry" element={null} />
        <Route path="/asset/*" element={<AssetPage />} />
        <Route path="/account/:parentId/:id" element={null} />
        <Route path="/account/:id" element={<AccountPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
    { skipRouter: true },
  );
}

describe("readAssetAccountChainDepth", () => {
  it("treats a page opened from elsewhere as the first of the chain", () => {
    expect(readAssetAccountChainDepth(undefined)).toBe(1);
    expect(readAssetAccountChainDepth({ accountBackPath: "/asset/bitcoin" })).toBe(1);
  });

  it("reads the depth stored in the location state", () => {
    expect(readAssetAccountChainDepth({ [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: 3 })).toBe(3);
  });

  it("ignores a depth that is not a positive integer", () => {
    expect(readAssetAccountChainDepth({ [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: "2" })).toBe(1);
    expect(readAssetAccountChainDepth({ [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: 0 })).toBe(1);
    expect(readAssetAccountChainDepth({ [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: 1.5 })).toBe(1);
  });
});

describe("assetChainPageKey", () => {
  it("gives the same key to an asset whatever the encoding of its route", () => {
    expect(assetChainPageKey("ethereum%2Ferc20%2Fsteth")).toBe(
      assetChainPageKey("ethereum/erc20/steth"),
    );
  });
});

describe("useAssetAccountChainNavigate", () => {
  it("keeps the extra state and stores the next depth and the page below", async () => {
    const { user } = renderChain("1");

    await user.click(screen.getByRole("button", { name: "hop" }));

    expect(screen.getByTestId("path")).toHaveTextContent("/account/2");
    expect(JSON.parse(screen.getByTestId("state").textContent ?? "null")).toEqual({
      origin: "test",
      [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: 2,
      [ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY]: "asset:1",
    });
  });

  it("returns to the entry point after two backs however many hops were made", async () => {
    const { user } = renderChain("1");

    for (let hop = 0; hop < 5; hop++) {
      await user.click(screen.getByRole("button", { name: "hop" }));
    }
    expect(screen.getByTestId("path")).toHaveTextContent("/account/6");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/account/2");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/asset/1");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/entry");
  });

  it("goes back to the page right below instead of showing it twice", async () => {
    const { user } = renderChain("A");

    await user.click(screen.getByRole("button", { name: "to account X" }));
    await user.click(screen.getByRole("button", { name: "to asset B" }));
    await user.click(screen.getByRole("button", { name: "to account X" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/account/X");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/asset/A");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/entry");
  });

  it("treats a token account as its main account page", async () => {
    const { user } = renderChain("A");

    await user.click(screen.getByRole("button", { name: "to account X" }));
    await user.click(screen.getByRole("button", { name: "to asset B" }));
    await user.click(screen.getByRole("button", { name: "to token of X" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/account/X");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/asset/A");
  });
});

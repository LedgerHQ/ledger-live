import React from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { render, screen } from "tests/testSetup";
import {
  ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY,
  readAssetAccountChainDepth,
  useAssetAccountChainNavigate,
} from "../assetAccountChain";

const DetailPage = () => {
  const navigateInChain = useAssetAccountChainNavigate();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <button onClick={() => navigateInChain(`/detail/${Number(id) + 1}`, { origin: "test" })}>
        hop
      </button>
      <button onClick={() => navigate(-1)}>back</button>
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

function renderChain() {
  return render(
    <MemoryRouter initialEntries={["/entry", "/detail/1"]} initialIndex={1}>
      <Routes>
        <Route path="/entry" element={null} />
        <Route path="/detail/:id" element={<DetailPage />} />
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

describe("useAssetAccountChainNavigate", () => {
  it("keeps the extra state and stores the next depth", async () => {
    const { user } = renderChain();

    await user.click(screen.getByRole("button", { name: "hop" }));

    expect(screen.getByTestId("path")).toHaveTextContent("/detail/2");
    expect(JSON.parse(screen.getByTestId("state").textContent ?? "null")).toEqual({
      origin: "test",
      [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: 2,
    });
  });

  it("returns to the entry point after two backs however many hops were made", async () => {
    const { user } = renderChain();

    for (let hop = 0; hop < 5; hop++) {
      await user.click(screen.getByRole("button", { name: "hop" }));
    }
    expect(screen.getByTestId("path")).toHaveTextContent("/detail/6");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/detail/2");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/detail/1");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/entry");
  });
});

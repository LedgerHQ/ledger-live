/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testUtils";
import { account, NftCollectionTest, NoNftCollectionTest } from "./shared";

describe("displayNftCollection", () => {
  it("should display NFTs collections", async () => {
    render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    const mockedNftElements = screen.getAllByText(/mocked nft/i);
    expect(mockedNftElements.length).toBeGreaterThan(0);
    mockedNftElements.forEach(element => expect(element).toBeVisible());

    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
  });

  it("should open the NFTs gallery", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    const mockedNftElements = screen.getAllByText(/mocked nft/i);
    expect(mockedNftElements.length).toBeGreaterThan(1);
    mockedNftElements.forEach(element => expect(element).toBeVisible());
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(screen.getByText(/see gallery/i));
    await expect(screen.getByText(/all nft/i)).toBeVisible();
    // Check breadcrumb and page title
    await expect(mockedNftElements.length).toBeGreaterThan(1);
  });

  it("should open the corresponding NFTs collection", async () => {
    const { user } = render(<NftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    const mockedNftElements = screen.getAllByText(/mocked nft/i);
    expect(mockedNftElements.length).toBeGreaterThan(1);
    mockedNftElements.forEach(element => expect(element).toBeVisible());
    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/see gallery/i)).toBeVisible();
    await user.click(mockedNftElements[0]);
    await expect(screen.getByText(/all nft/i)).toBeVisible();
    // Check breadcrumb and page title
    await expect(mockedNftElements.length).toBeGreaterThan(1);
    await user.click(mockedNftElements[0]);
  });

  it("should not display nft", async () => {
    render(<NoNftCollectionTest />, {
      initialState: {
        accounts: [account],
      },
      initialRoute: `/`,
    });

    await expect(screen.getByText(/receive nft/i)).toBeVisible();
    await expect(screen.getByText(/learn more/i)).toBeVisible();
  });
});

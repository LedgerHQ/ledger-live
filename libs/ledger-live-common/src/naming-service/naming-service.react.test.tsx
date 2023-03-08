import { NamingServiceProvider, useNamingService } from ".";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render, screen, waitFor } from "@testing-library/react";
import { getAddressByName, getNameByAddress } from "./api";
import { LedgerAPI4xx } from "@ledgerhq/errors";

jest.mock("./api");

const mockedGetAddressByName = jest.mocked(getAddressByName, true);
const mockedGetNameByAddress = jest.mocked(getNameByAddress, true);

const CustomTest = ({ str }: { str: string }) => {
  const data = useNamingService(str);

  let address: string | undefined;
  let name: string | undefined;
  let type: string | undefined;

  const status = data.status;
  if (data.status === "loaded") {
    address = data.address;
    name = data.name;
    type = data.type;
  }

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="address">{address}</div>
      <div data-testid="name">{name}</div>
      <div data-testid="type">{type}</div>
    </div>
  );
};

describe("useNamingService", () => {
  test("should be an error", async () => {
    mockedGetAddressByName.mockImplementation(async () => {
      throw new LedgerAPI4xx();
    });

    render(
      <NamingServiceProvider>
        <CustomTest str="notavalideth" />
      </NamingServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).not.toBe("loading");
    });

    // this test should be first otherwise mock call will be more than 0
    expect(mockedGetAddressByName).toBeCalledTimes(0);
    expect(screen.getByTestId("status").textContent).toBe("error");
  });

  test("should be queue", () => {
    const { result } = renderHook(useNamingService, {
      initialProps: "vitalik.eth",
    });

    expect(result.current.status).toBe("queued");
  });

  test("success forward", async () => {
    mockedGetAddressByName.mockImplementation(async () => {
      return "forced mocked address";
    });

    render(
      <NamingServiceProvider>
        <CustomTest str="vitalik.eth" />
      </NamingServiceProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("status").textContent).toBe("loaded");
      },
      { timeout: 5000 }
    );

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("type").textContent).toBe("forward");
    expect(screen.getByTestId("name").textContent).toBe("vitalik.eth");
    expect(screen.getByTestId("address").textContent).toBe(
      "forced mocked address"
    );
  });

  test("success reverse", async () => {
    mockedGetNameByAddress.mockImplementation(async () => {
      return "vitalik.eth";
    });

    render(
      <NamingServiceProvider>
        <CustomTest str="0xd8da6bf26964af9d7eed9e03e53415d37aa96045" />
      </NamingServiceProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("status").textContent).toBe("loaded");
      },
      { timeout: 5000 }
    );

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("type").textContent).toBe("reverse");
    expect(screen.getByTestId("name").textContent).toBe("vitalik.eth");
    expect(screen.getByTestId("address").textContent).toBe(
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
    );
  });
});

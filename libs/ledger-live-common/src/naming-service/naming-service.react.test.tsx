import { NamingServiceProvider, useNamingService } from ".";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render, screen, waitFor } from "@testing-library/react";
import { getAddressByName } from "./api";
import { LedgerAPI4xx } from "@ledgerhq/errors";

jest.mock("./api");

const mockedGetAddressByName = jest.mocked(getAddressByName, true);

const CustomTest = ({ name }: { name: string }) => {
  const data = useNamingService(name);

  let result: string | undefined;

  const status = data.status;
  if (data.status === "loaded") {
    result = data.address;
  } else {
    result = undefined;
  }

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="result">{result}</div>
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
        <CustomTest name="notavalideth" />
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

  test("success", async () => {
    mockedGetAddressByName.mockImplementation(async () => {
      return "forced mocked address";
    });

    render(
      <NamingServiceProvider>
        <CustomTest name="vitalik.eth" />
      </NamingServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).not.toBe("loading");
    });

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("result").textContent).toBe(
      "forced mocked address"
    );
  });
});

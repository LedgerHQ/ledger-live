import { NamingServiceProvider, useNamingService } from ".";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render, screen, waitFor } from "@testing-library/react";
import { resolveAddress, resolveDomain } from "../resolvers";

jest.mock("../resolvers");

const mockedResolvedDomain = jest.mocked(resolveDomain, true);
const mockedResolvedAddress = jest.mocked(resolveAddress, true);

const CustomTest = ({ str }: { str: string }) => {
  const data = useNamingService(str);

  let address: string | undefined;
  let domain: string | undefined;
  let type: string | undefined;

  const status = data.status;
  if (data.status === "loaded") {
    address = data.address;
    domain = data.domain;
    type = data.type;
  }

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="address">{address}</div>
      <div data-testid="domain">{domain}</div>
      <div data-testid="type">{type}</div>
    </div>
  );
};

describe("useNamingService", () => {
  test("should be an error", async () => {
    mockedResolvedDomain.mockImplementation(async () => {
      return [];
    });

    mockedResolvedAddress.mockImplementation(async () => {
      return [];
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
    expect(screen.getByTestId("status").textContent).toBe("error");
  });

  test("should be queue", () => {
    const { result } = renderHook(useNamingService, {
      initialProps: "vitalik.eth",
    });

    expect(result.current.status).toBe("queued");
  });

  test("success forward", async () => {
    mockedResolvedDomain.mockImplementation(async () => {
      return [{ address: "forced mocked address", registry: "ens" }];
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
    expect(screen.getByTestId("domain").textContent).toBe("vitalik.eth");
    expect(screen.getByTestId("address").textContent).toBe(
      "forced mocked address"
    );
  });

  test("success reverse", async () => {
    mockedResolvedDomain.mockImplementation(async () => {
      return [];
    });
    mockedResolvedAddress.mockImplementation(async () => {
      return [{ domain: "vitalik.eth", registry: "ens" }];
    });

    render(
      <NamingServiceProvider>
        <CustomTest str="0xd8da6bf26964af9d7eed9e03e53415d37aa96045" />
      </NamingServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("loaded");
    });

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("domain").textContent).toBe("vitalik.eth");
    expect(screen.getByTestId("address").textContent).toBe(
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
    );
    expect(screen.getByTestId("type").textContent).toBe("reverse");
  });
});

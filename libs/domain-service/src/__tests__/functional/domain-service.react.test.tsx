import React from "react";
import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react-hooks";
import { render, screen, waitFor } from "@testing-library/react";
import { DomainServiceProvider, useDomain } from "../../hooks";
import { resolveAddress, resolveDomain } from "../../resolvers";
import { DomainServiceResolution } from "../../types";

jest.mock("../../resolvers");

const mockedResolvedDomain = jest.mocked(resolveDomain, true);
const mockedResolvedAddress = jest.mocked(resolveAddress, true);

const resolutionKeys: (keyof DomainServiceResolution)[] = [
  "registry",
  "address",
  "domain",
];

const CustomTest = ({ str }: { str: string }) => {
  const result = useDomain(str);
  const { status } = result;

  return (
    <div>
      <div data-testid="status">{status}</div>
      {status === "loaded" && (
        <div data-testid="resolutions">
          {result.resolutions.map((resolution, index) => (
            <React.Fragment key={index}>
              <div data-testid={`${index}-registry`}>{resolution.registry}</div>
              <div data-testid={`${index}-address`}>{resolution.address}</div>
              <div data-testid={`${index}-domain`}>{resolution.domain}</div>
            </React.Fragment>
          ))}
        </div>
      )}
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
      <DomainServiceProvider>
        <CustomTest str="notavalideth" />
      </DomainServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).not.toBe("loading");
    });

    // this test should be first otherwise mock call will be more than 0
    expect(screen.getByTestId("status").textContent).toBe("error");
  });

  test("should be queue", () => {
    const { result } = renderHook(useDomain, {
      initialProps: "vitalik.eth",
    });

    expect(result.current.status).toBe("queued");
  });

  test("success forward", async () => {
    const resolutions: DomainServiceResolution[] = [
      {
        address: "forced mocked address",
        registry: "ens",
        domain: "vitalik.eth",
        type: "forward",
      },
    ];
    mockedResolvedDomain.mockImplementation(async () => resolutions);

    render(
      <DomainServiceProvider>
        <CustomTest str="vitalik.eth" />
      </DomainServiceProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("status").textContent).toBe("loaded");
      },
      { timeout: 5000 }
    );

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("resolutions")).toBeInTheDocument();
    resolutions.forEach((resolution, index) => {
      resolutionKeys.forEach((field) => {
        expect(screen.getByTestId("resolutions")).toContainElement(
          screen.getByTestId(`${index}-${field}`)
        );
        expect(screen.getByTestId(`${index}-${field}`).textContent).toBe(
          resolution[field]
        );
      });
    });
  });

  test("success reverse", async () => {
    const reverseResolutions: DomainServiceResolution[] = [
      {
        domain: "vitalik.eth",
        registry: "ens",
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        type: "reverse",
      },
    ];
    mockedResolvedDomain.mockImplementation(async () => {
      return [];
    });
    mockedResolvedAddress.mockImplementation(async () => reverseResolutions);

    render(
      <DomainServiceProvider>
        <CustomTest str="0xd8da6bf26964af9d7eed9e03e53415d37aa96045" />
      </DomainServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("loaded");
    });

    expect(screen.getByTestId("status").textContent).toBe("loaded");
    expect(screen.getByTestId("resolutions")).toBeInTheDocument();
    reverseResolutions.forEach((resolution, index) => {
      resolutionKeys.forEach((field) => {
        expect(screen.getByTestId("resolutions")).toContainElement(
          screen.getByTestId(`${index}-${field}`)
        );
        expect(screen.getByTestId(`${index}-${field}`).textContent).toBe(
          resolution[field]
        );
      });
    });
  });
});

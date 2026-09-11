import { getEnv, setEnv } from "@shared/env";
import { getMockServerTransportUrl } from "./useDeviceManagementKit";

const PROD_URL = "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

describe("getMockServerTransportUrl", () => {
  const initial = getEnv("MOCK_SERVER_TRANSPORT_URL");

  afterEach(() => {
    setEnv("MOCK_SERVER_TRANSPORT_URL", initial);
  });

  it("defaults to the shared mock server deployment", () => {
    expect(getMockServerTransportUrl()).toBe(PROD_URL);
  });

  it("honours an override pointing at a local instance", () => {
    setEnv("MOCK_SERVER_TRANSPORT_URL", "http://localhost:9752");

    expect(getMockServerTransportUrl()).toBe("http://localhost:9752");
  });

  it("strips trailing slashes so callers can append paths", () => {
    setEnv("MOCK_SERVER_TRANSPORT_URL", "http://localhost:9752//");

    expect(getMockServerTransportUrl()).toBe("http://localhost:9752");
  });
});

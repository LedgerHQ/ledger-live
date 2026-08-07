import { renderHook } from "@testing-library/react";
import { useNavigate } from "react-router";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { useInitializerActions } from "../hooks/useInitializerActions";

jest.mock("react-router", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedUseLocalizedUrl = jest.mocked(useLocalizedUrl);
const mockedOpenURL = jest.mocked(openURL);
const navigate = jest.fn();

describe("useInitializerActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(navigate);
    mockedUseLocalizedUrl.mockReturnValue("https://support.ledger.com/en");
  });

  it("GIVEN no search query WHEN opening My Ledger THEN it navigates to Manager", () => {
    // GIVEN
    const { result } = renderHook(() => useInitializerActions());

    // WHEN
    result.current.openMyLedger();

    // THEN
    expect(navigate).toHaveBeenCalledWith("/manager");
  });

  it("GIVEN an app search query WHEN opening My Ledger THEN it navigates to Manager with encoded search", () => {
    // GIVEN
    const { result } = renderHook(() => useInitializerActions());

    // WHEN
    result.current.openMyLedger("Ethereum Classic");

    // THEN
    expect(navigate).toHaveBeenCalledWith("/manager?q=Ethereum%20Classic");
  });

  it("GIVEN firmware update is required WHEN opening firmware update THEN it navigates to Manager firmware route", () => {
    // GIVEN
    const { result } = renderHook(() => useInitializerActions());

    // WHEN
    result.current.openMyLedgerFirmwareUpdate();

    // THEN
    expect(navigate).toHaveBeenCalledWith("/manager?firmwareUpdate=true");
  });

  it("GIVEN a device is not onboarded WHEN opening onboarding THEN it navigates to desktop onboarding entry", () => {
    // GIVEN
    const { result } = renderHook(() => useInitializerActions());

    // WHEN
    result.current.openOnboarding();

    // THEN
    expect(navigate).toHaveBeenCalledWith("/onboarding/select-device");
  });

  it("GIVEN contact support is requested WHEN opening support THEN it opens the localized support URL", () => {
    // GIVEN
    const { result } = renderHook(() => useInitializerActions());

    // WHEN
    result.current.openSupport();

    // THEN
    expect(mockedUseLocalizedUrl).toHaveBeenCalledWith(urls.contactSupport);
    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/en");
  });
});

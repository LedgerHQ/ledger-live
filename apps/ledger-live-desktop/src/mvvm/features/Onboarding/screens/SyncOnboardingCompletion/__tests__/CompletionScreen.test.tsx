/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import CompletionScreen from "..";
import { DeviceModelId } from "@ledgerhq/types-devices";
import * as UseCompletionScreenViewModel from "../useCompletionScreenViewModel";

jest.mock("../useCompletionScreenViewModel", () => ({
  useCompletionScreenViewModel: jest.fn(),
}));

describe("CompletionScreen", () => {
  beforeEach(() => {
    jest.mocked(UseCompletionScreenViewModel.useCompletionScreenViewModel).mockReset();
  });

  [DeviceModelId.stax, DeviceModelId.apex, DeviceModelId.europa].forEach(deviceModelId =>
    it(`should display ${deviceModelId} animation and redirect to post onboarding`, async () => {
      jest
        .mocked(UseCompletionScreenViewModel.useCompletionScreenViewModel)
        .mockImplementation(() => ({
          seedConfiguration: "new_seed",
          deviceModelId,
        }));
      render(<CompletionScreen />);

      const staxCompletion = screen.getByTestId(`${deviceModelId}-completion-view`);
      expect(staxCompletion).toBeVisible();
    }),
  );
});

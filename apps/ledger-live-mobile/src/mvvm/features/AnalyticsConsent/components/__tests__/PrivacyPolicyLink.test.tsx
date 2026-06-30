import React from "react";
import { render, screen } from "@tests/test-renderer";
import PrivacyPolicyLink from "../PrivacyPolicyLink";

describe("PrivacyPolicyLink", () => {
  it("should render the privacy policy disclaimer with an inline link", () => {
    render(<PrivacyPolicyLink onPrivacyPolicyPress={jest.fn()} />);

    expect(screen.getByText(/You can revoke your consent anytime in settings\./)).toBeVisible();
    expect(screen.getByRole("link", { name: "Privacy policy" })).toBeVisible();
  });

  it("should call onPrivacyPolicyPress when the privacy policy link is pressed", async () => {
    const onPrivacyPolicyPress = jest.fn();
    const { user } = render(<PrivacyPolicyLink onPrivacyPolicyPress={onPrivacyPolicyPress} />);

    await user.press(screen.getByRole("link", { name: "Privacy policy" }));

    expect(onPrivacyPolicyPress).toHaveBeenCalledTimes(1);
  });
});

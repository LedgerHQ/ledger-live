import React from "react";
import { render } from "@testing-library/react-native";
import { SecurityRowIcon } from "./SecurityRowIcon";

const renderIcon = (props: React.ComponentProps<typeof SecurityRowIcon>) =>
  JSON.stringify(render(<SecurityRowIcon {...props} />).toJSON());

describe("SecurityRowIcon on mobile", () => {
  it.each(["hideBalance", "appLock", "mevProtection"] as const)("shows an icon for %s", id => {
    expect(render(<SecurityRowIcon id={id} />).toJSON()).not.toBeNull();
  });

  it.each(["changePassword", "autoLock"] as const)("shows no icon for %s", id => {
    expect(render(<SecurityRowIcon id={id} />).toJSON()).toBeNull();
  });

  it("shows the Face ID icon on a Face ID device and the fingerprint icon on the others", () => {
    const faceId = renderIcon({ id: "biometrics", biometricKind: "faceId" });
    const touchId = renderIcon({ id: "biometrics", biometricKind: "touchId" });
    const biometrics = renderIcon({ id: "biometrics", biometricKind: "biometrics" });

    expect(faceId).not.toEqual(touchId);
    expect(touchId).toEqual(biometrics);
  });
});

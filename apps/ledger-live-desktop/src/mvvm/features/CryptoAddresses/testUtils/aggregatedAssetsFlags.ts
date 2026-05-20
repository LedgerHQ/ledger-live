import { withFlagOverrides } from "tests/testSetup";

export const aggregatedAssetsFlags = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { aggregatedAssets: true } },
});

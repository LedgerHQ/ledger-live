/**
 * Determines the APY indicator appearance based on user's region.
 * UK users see grey APY indicator, non-UK users see green (success).
 *
 * @param region - The user's region code (e.g., "GB", "US", "FR")
 * @returns The appearance value for the APY Tag component
 */
export const getApyAppearance = (region: string | undefined): "gray" | "success" => {
  return region === "GB" ? "gray" : "success";
};

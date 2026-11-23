// oxlint-disable-next-line coin-families/options-probe -- named disable
export const a = 1;
// eslint-disable-next-line coin-families/realistic
export const b = ["solana"].includes("solana");
/* oxlint-disable coin-families/comments-probe */
export const c = "x" === "stellar";
export const d = (id: string) => {
  switch (id) {
    case "aptos":
      return 1;
    default:
      return 0;
  }
};

// eslint-disable-next-line prettier/prettier
module.exports = (chains) => 
`${chains
    .map(
      ({ chainId, name }) =>
        `import ${name}_tokens from "./${chainId}/erc20.json"`
    )
    .join(";" + String.fromCharCode(10))};
${chains
  .map(
    ({ chainId, name }) =>
      `import ${name}_signatures from "./${chainId}/erc20-signatures.json"`
  )
  .join(";" + String.fromCharCode(10))};

export const tokens = {
${chains
  .map(({ chainId, name }) => `  ${chainId}: ${name}_tokens`)
  .join("," + String.fromCharCode(10))},
};

export const signatures = {
${chains
  .map(({ chainId, name }) => `  ${chainId}: ${name}_signatures`)
  .join("," + String.fromCharCode(10))},
};

export default {
  tokens,
  signatures,
};${String.fromCharCode(10)}`;

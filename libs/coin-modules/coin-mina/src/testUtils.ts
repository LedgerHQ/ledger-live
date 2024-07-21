import { setCoinConfig } from "./config";

export const setConfig = () => {
  setCoinConfig((): any => {
    return {
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina-rosetta-api-devnet.zondax.dev",
      },
    };
  });
};

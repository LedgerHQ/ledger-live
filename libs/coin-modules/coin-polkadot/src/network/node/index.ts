import { fetchConstants } from "./constants";
import { fetchStakingInfo } from "./stakingInfo";
import { fetchValidators } from "./validators";
import { fetchNominations } from "./nominations";

import getApiPromise from "./apiPromise";
export { getApiPromise };

export default {
  fetchConstants,
  fetchStakingInfo,
  fetchValidators,
  fetchNominations,
};

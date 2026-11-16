import { useReducer } from "react";
import {
  INITIAL_STAKE_POSITION_STEP,
  stakePositionStepReducer,
  type StakePositionStep,
  type StakePositionStepEvent,
} from "./stakePositionStepReducer";

type StakePositionSteps = [StakePositionStep, (event: StakePositionStepEvent) => void];

/** The step state of one request: key the component that calls it by the request id. */
export function useStakePositionSteps(): StakePositionSteps {
  return useReducer(stakePositionStepReducer, INITIAL_STAKE_POSITION_STEP);
}

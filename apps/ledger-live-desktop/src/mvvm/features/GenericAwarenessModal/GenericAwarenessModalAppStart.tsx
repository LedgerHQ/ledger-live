import useGenericAwarenessModalAppStart from "./hooks/useGenericAwarenessModalAppStart";
import useHydrateDevGenericAwarenessModalCards from "./hooks/useHydrateDevGenericAwarenessModalCards";

/** Side-effect component: opens Generic Awareness Modal when an APP_START campaign is in the store. */
const GenericAwarenessModalAppStart = () => {
  useHydrateDevGenericAwarenessModalCards();
  useGenericAwarenessModalAppStart();
  return null;
};

export default GenericAwarenessModalAppStart;

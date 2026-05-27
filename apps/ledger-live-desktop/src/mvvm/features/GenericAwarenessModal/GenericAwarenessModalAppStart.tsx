import useGenericAwarenessModalAppStart from "./hooks/useGenericAwarenessModalAppStart";

/** Side-effect component: opens Generic Awareness Modal when an APP_START campaign is in the store. */
const GenericAwarenessModalAppStart = () => {
  useGenericAwarenessModalAppStart();
  return null;
};

export default GenericAwarenessModalAppStart;

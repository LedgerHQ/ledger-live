import React, { useCallback, useState } from "react";

/**
 * Use this to wrap your component and pass it a function "remountMe" as a prop
 * that simply remounts the component.
 * */
export default function withRemountableWrapper<T>(
  Component: React.ComponentType<T & { remountMe: () => void }>
): React.FC<T> {
  const WrappedComponent: React.FC<T> = (props: T) => {
    const [nonce, setNonce] = useState(0);
    const remountMe = useCallback(() => {
      setNonce(nonce + 1);
    }, [nonce, setNonce]);
    /**
     * The "key" prop identifies a unique instance of a component, so if it
     * changes, the current instance is unmounted and a new instance is mounted
     * with a new state.
     * */
    return <Component key={nonce} {...props} remountMe={remountMe} />;
  };
  return WrappedComponent;
}

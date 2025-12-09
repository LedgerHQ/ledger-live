import React from "react";
import { GenericMemoTagInput } from "./GenericMemoTagInput";

type MemoTagFactoryProps = {
  network: string;
  onChange: (value: string) => void;
  onSkip: () => void;
};

export type CommonMemoTagComponentProps = {
  onChange: (value: string) => void;
};

const componentPerNetwork = new Map<string, React.ComponentType<CommonMemoTagComponentProps>>();

export function registerComponentForNetwork(
  network: string,
  component: React.ComponentType<CommonMemoTagComponentProps>,
): void {
  componentPerNetwork.set(network, component);
}

export default function MemoTagFactory({ network, onChange, onSkip }: MemoTagFactoryProps) {
  const Component = componentPerNetwork.get(network);
  if (Component) {
    return <Component onChange={onChange} />;
  }

  return <GenericMemoTagInput onChange={onChange} onSkip={onSkip} network={network} />;
}

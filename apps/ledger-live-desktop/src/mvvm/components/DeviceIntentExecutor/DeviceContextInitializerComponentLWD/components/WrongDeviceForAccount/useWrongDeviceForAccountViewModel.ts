import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  onCancel: () => void;
}>;

export function useWrongDeviceForAccountViewModel({ onCancel }: Params) {
  const { openSupport } = useInitializerActions();

  return {
    onCancel,
    onContactSupport: openSupport,
  };
}

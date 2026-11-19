type ButtonProps = {
  children: string;
  disabled?: boolean;
  onPress?: () => void;
};

/** The shared native Lumen stub, with buttons that expose the role and disabled state it drops. */
export function lumenNativeWithAccessibleButtons() {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const overrides: Record<string, unknown> = {
    Button: ({ children, disabled, onPress }: ButtonProps) =>
      createElement(
        "Pressable",
        {
          accessible: true,
          accessibilityRole: "button",
          accessibilityState: { disabled: Boolean(disabled) },
          onPress,
        },
        createElement("Text", undefined, children),
      ),
  };

  return new Proxy(overrides, {
    get: (target, prop: string) => (prop in target ? target[prop] : lumen[prop]),
  });
}

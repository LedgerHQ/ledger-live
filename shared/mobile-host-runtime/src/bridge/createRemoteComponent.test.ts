import { createRemoteComponent } from "./createRemoteComponent";
import { RemoteErrorBoundary } from "./RemoteErrorBoundary";

describe("RemoteErrorBoundary", () => {
  it("derives error state from a thrown error", () => {
    const error = new Error("boom");
    expect(RemoteErrorBoundary.getDerivedStateFromError(error)).toEqual({ error });
  });
});

describe("createRemoteComponent", () => {
  it("returns a named component without invoking the loader eagerly", () => {
    const loader = jest.fn(async () => ({ default: () => null }));
    const Remote = createRemoteComponent({ loader });

    expect(typeof Remote).toBe("function");
    expect(Remote.displayName).toBe("RemoteComponent");
    // React.lazy defers the loader until first render — creating the component must not call it.
    expect(loader).not.toHaveBeenCalled();
  });
});

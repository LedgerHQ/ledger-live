import { createLifecycleHub } from "./lifecycleHub";

describe("createLifecycleHub", () => {
  it("calls the listeners registered, until they unsubscribe", () => {
    const hub = createLifecycleHub();
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = hub.subscribe(first);
    hub.subscribe(second);

    hub.emit({ type: "reset" });
    unsubscribeFirst();
    hub.emit({ type: "reset" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("lists the rotation handlers registered, until they unregister", () => {
    const hub = createLifecycleHub();
    const handler = jest.fn();
    const unregister = hub.onKeyRotation(handler);
    expect(hub.rotationHandlers()).toEqual([handler]);
    unregister();
    expect(hub.rotationHandlers()).toEqual([]);
  });
});

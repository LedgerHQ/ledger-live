type Listener = () => void;

const listeners = new Set<Listener>();

export const scrollToTopEvent = {
  emit: () => listeners.forEach(fn => fn()),
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

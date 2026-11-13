// Animations are visual only: render plain views, keep the API shape the karaoke calls.
const chainable = () => {
  const animation = { delay: () => animation, duration: () => animation, easing: () => animation };
  return animation;
};

class Keyframe {
  duration() {
    return this;
  }
}

const LayoutAnimationConfig = ({ children }) => children;

module.exports = {
  __esModule: true,
  default: { View: "View", Text: "Text" },
  css: { create: styles => styles, keyframes: keyframes => keyframes },
  cubicBezier: () => "cubic-bezier",
  Easing: { bezier: () => () => 0 },
  Keyframe,
  LayoutAnimationConfig,
  FadeIn: chainable(),
  FadeOut: chainable(),
};

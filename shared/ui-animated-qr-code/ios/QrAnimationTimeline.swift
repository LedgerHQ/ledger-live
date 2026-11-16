import CoreGraphics

// Mirror of src/animationTimeline.ts: change the three together so both platforms play the same
// animation. The center badge is not drawn natively, so only dots and finders live here. A frame is
// split into a loading level and a ripple scale: the view caches the colors and skips unchanged
// layers.
enum QrElementKind {
  case dot
  case finder
}

struct QrElement {
  let kind: QrElementKind
  // From the element's center to the code's, in fractions of the QR side. Computed once, not per frame.
  let distanceToCenter: CGFloat

  // x and y: center of the element, in fractions of the QR side (0 to 1).
  init(x: CGFloat, y: CGFloat, kind: QrElementKind) {
    self.kind = kind
    distanceToCenter = hypot(x - 0.5, y - 0.5)
  }
}

struct QrRgb {
  let r: CGFloat
  let g: CGFloat
  let b: CGFloat

  init(gray: CGFloat) {
    r = gray / 255
    g = gray / 255
    b = gray / 255
  }
}

enum QrAnimationTimeline {
  static let neverPressed: CGFloat = -1
  static let ink = QrRgb(gray: 0x11)
  private static let skeletonGray: CGFloat = 0xE9
  private static let shimmerGray: CGFloat = 0xF7
  // One level per 8-bit gray from the skeleton to the shimmer: 0 is the skeleton.
  static let loadingLevelCount = Int(shimmerGray - skeletonGray) + 1

  private static let shimmerBand: CGFloat = 0.3
  private static let shimmerSweep: CGFloat = 1.2

  private static let rippleDelay: CGFloat = 0.1
  private static let rippleSweep: CGFloat = 0.9
  private static let rippleBand: CGFloat = 0.12
  private static let rippleScale: CGFloat = 0.4
  private static let rippleReach: CGFloat = 0.5.squareRoot()

  static func loadingColor(level: Int) -> QrRgb {
    QrRgb(gray: skeletonGray + CGFloat(level))
  }

  static func loadingLevel(time: CGFloat, element: QrElement) -> Int {
    let sweep = time.truncatingRemainder(dividingBy: shimmerSweep) / shimmerSweep
    let position = sweep * (1 + 2 * shimmerBand) - shimmerBand
    let shine = band(element.distanceToCenter / rippleReach, position, shimmerBand)
    return Int((shine * CGFloat(loadingLevelCount - 1)).rounded())
  }

  static func rippleScale(time: CGFloat, element: QrElement, pressedAt: CGFloat) -> CGFloat {
    let age = time - pressedAt
    guard pressedAt >= 0, age >= 0, element.kind == .dot else { return 1 }
    let progress = (age - rippleDelay) / rippleSweep
    guard progress >= 0, progress <= 1 else { return 1 }
    let position = progress * (rippleReach + rippleBand)
    return 1 + rippleScale * band(element.distanceToCenter, position, rippleBand)
  }

  // Native only: the view stops its display link while nothing moves.
  static func isMoving(animation: String, time: CGFloat, pressedAt: CGFloat) -> Bool {
    animation == "loading" || (pressedAt >= 0 && time - pressedAt <= rippleDelay + rippleSweep)
  }

  // 1 when value sits on position, 0 once it is width away.
  private static func band(_ value: CGFloat, _ position: CGFloat, _ width: CGFloat) -> CGFloat {
    smoothstep(1 - abs(value - position) / width)
  }

  private static func smoothstep(_ x: CGFloat) -> CGFloat {
    let c = min(1, max(0, x))
    return c * c * (3 - 2 * c)
  }
}

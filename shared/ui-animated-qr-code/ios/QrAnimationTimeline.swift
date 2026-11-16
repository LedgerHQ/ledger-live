import CoreGraphics

// Mirror of src/animationTimeline.ts: change the three together so both platforms play the same
// animation. The center badge is not drawn natively, so only dots and finders live here.
enum QrElementKind {
  case dot
  case finder
}

// Center of the element, in fractions of the QR side (0 to 1).
struct QrElement {
  let x: CGFloat
  let y: CGFloat
  let kind: QrElementKind
}

struct QrRgb {
  let r: CGFloat
  let g: CGFloat
  let b: CGFloat

  init(hex: UInt32) {
    r = CGFloat((hex >> 16) & 0xFF) / 255
    g = CGFloat((hex >> 8) & 0xFF) / 255
    b = CGFloat(hex & 0xFF) / 255
  }

  init(r: CGFloat, g: CGFloat, b: CGFloat) {
    self.r = r
    self.g = g
    self.b = b
  }

  func mixed(with other: QrRgb, amount: CGFloat) -> QrRgb {
    QrRgb(
      r: r + (other.r - r) * amount,
      g: g + (other.g - g) * amount,
      b: b + (other.b - b) * amount
    )
  }
}

struct QrElementFrame {
  let scale: CGFloat
  let color: QrRgb
}

enum QrAnimationTimeline {
  static let neverPressed: CGFloat = -1
  static let ink = QrRgb(hex: 0x111111)
  static let skeleton = QrRgb(hex: 0xE9E9E9)
  static let shimmer = QrRgb(hex: 0xF7F7F7)

  private static let shimmerBand: CGFloat = 0.3
  private static let shimmerSweep: CGFloat = 1.2

  private static let rippleDelay: CGFloat = 0.1
  private static let rippleSweep: CGFloat = 0.9
  private static let rippleBand: CGFloat = 0.12
  private static let rippleScale: CGFloat = 0.4
  private static let rippleReach: CGFloat = 0.5.squareRoot()

  static func frame(animation: String, time: CGFloat, element: QrElement, pressedAt: CGFloat) -> QrElementFrame {
    animation == "loading"
      ? loadingFrame(time: time, element: element)
      : copyFrame(time: time, element: element, pressedAt: pressedAt)
  }

  // Native only: the view stops its display link while nothing moves.
  static func isMoving(animation: String, time: CGFloat, pressedAt: CGFloat) -> Bool {
    animation == "loading" || (pressedAt >= 0 && time - pressedAt <= rippleDelay + rippleSweep)
  }

  private static func loadingFrame(time: CGFloat, element: QrElement) -> QrElementFrame {
    let sweep = time.truncatingRemainder(dividingBy: shimmerSweep) / shimmerSweep
    let position = sweep * (1 + 2 * shimmerBand) - shimmerBand
    let shine = band(distanceToCenter(element) / rippleReach, position, shimmerBand)
    return QrElementFrame(scale: 1, color: skeleton.mixed(with: shimmer, amount: shine))
  }

  private static func copyFrame(time: CGFloat, element: QrElement, pressedAt: CGFloat) -> QrElementFrame {
    let age = time - pressedAt
    guard pressedAt >= 0, age >= 0, element.kind == .dot else { return QrElementFrame(scale: 1, color: ink) }
    let progress = (age - rippleDelay) / rippleSweep
    guard progress >= 0, progress <= 1 else { return QrElementFrame(scale: 1, color: ink) }
    let position = progress * (rippleReach + rippleBand)
    let grow = band(distanceToCenter(element), position, rippleBand)
    return QrElementFrame(scale: 1 + rippleScale * grow, color: ink)
  }

  private static func distanceToCenter(_ element: QrElement) -> CGFloat {
    hypot(element.x - 0.5, element.y - 0.5)
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

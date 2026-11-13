import CoreGraphics

// Mirror of src/animationTimeline.ts: change both together so the benchmark compares like for like.
// The center badge is not drawn natively, so only dots and finders live here.
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

// The finger: position in fractions of the side, times (s) it went down and up.
// pressedAt < 0: never pressed. releasedAt < 0: still down.
struct QrTouch {
  var x: CGFloat
  var y: CGFloat
  var pressedAt: CGFloat
  var releasedAt: CGFloat

  static let none = QrTouch(x: 0, y: 0, pressedAt: -1, releasedAt: -1)
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
  static let ink = QrRgb(hex: 0x111111)
  static let skeleton = QrRgb(hex: 0xE9E9E9)
  static let shimmer = QrRgb(hex: 0xF7F7F7)

  private static let shimmerBand: CGFloat = 0.3
  private static let shimmerSweep: CGFloat = 1.2
  private static let loadingEnd: CGFloat = 4.8
  private static let fadeInEnd: CGFloat = 5.2
  private static let holdEnd: CGFloat = 6.7
  private static let shimmerPeriod: CGFloat = 7.2

  private static let rippleDelay: CGFloat = 0.1
  private static let rippleSweep: CGFloat = 0.9
  private static let rippleBand: CGFloat = 0.12
  private static let rippleScale: CGFloat = 0.4
  private static let rippleReach: CGFloat = 0.5.squareRoot()
  private static let autoPressPeriod: CGFloat = 1.6
  private static let autoHold: CGFloat = 0.8

  private static let hoverRadius: CGFloat = 0.14
  private static let hoverScale: CGFloat = 0.8
  private static let hoverRelease: CGFloat = 0.25

  static func frame(animation: String, time: CGFloat, element: QrElement, touch: QrTouch) -> QrElementFrame {
    switch animation {
    case "shimmer": return shimmerFrame(time: time, element: element)
    case "copy": return copyFrame(time: time, element: element, touch: touch)
    default: return hoverFrame(time: time, element: element, touch: touch)
    }
  }

  // With auto play on, a press every autoPressPeriod: a tap in the center for copy, an autoHold
  // hold somewhere on the code for hover. A release time in the future means the finger is still down.
  static func autoTouch(animation: String, time: CGFloat, touch: QrTouch) -> QrTouch {
    guard animation != "shimmer" else { return touch }
    let due = touch.pressedAt < 0 || time - touch.pressedAt >= autoPressPeriod
    guard due else { return touch }
    if animation == "copy" { return QrTouch(x: 0.5, y: 0.5, pressedAt: time, releasedAt: time) }
    return QrTouch(
      x: 0.5 + 0.3 * sin(time * 2.3),
      y: 0.5 + 0.3 * sin(time * 1.7 + 0.7),
      pressedAt: time,
      releasedAt: time + autoHold
    )
  }

  private static func shimmerReveal(_ time: CGFloat) -> CGFloat {
    let local = time.truncatingRemainder(dividingBy: shimmerPeriod)
    if local < loadingEnd { return 0 }
    if local < fadeInEnd { return smoothstep((local - loadingEnd) / (fadeInEnd - loadingEnd)) }
    if local < holdEnd { return 1 }
    return 1 - smoothstep((local - holdEnd) / (shimmerPeriod - holdEnd))
  }

  private static func shimmerFrame(time: CGFloat, element: QrElement) -> QrElementFrame {
    let local = time.truncatingRemainder(dividingBy: shimmerPeriod)
    if local < loadingEnd {
      let sweep = local.truncatingRemainder(dividingBy: shimmerSweep) / shimmerSweep
      let position = sweep * (1 + 2 * shimmerBand) - shimmerBand
      let amount = band(hypot(element.x - 0.5, element.y - 0.5) / rippleReach, position, shimmerBand)
      return QrElementFrame(scale: 1, color: skeleton.mixed(with: shimmer, amount: amount))
    }
    return QrElementFrame(scale: 1, color: skeleton.mixed(with: ink, amount: shimmerReveal(time)))
  }

  private static func copyFrame(time: CGFloat, element: QrElement, touch: QrTouch) -> QrElementFrame {
    let age = time - touch.pressedAt
    guard touch.pressedAt >= 0, age >= 0, element.kind == .dot else { return QrElementFrame(scale: 1, color: ink) }
    let progress = (age - rippleDelay) / rippleSweep
    guard progress >= 0, progress <= 1 else { return QrElementFrame(scale: 1, color: ink) }
    let position = progress * (rippleReach + rippleBand)
    let distance = hypot(element.x - 0.5, element.y - 0.5)
    return QrElementFrame(scale: 1 + rippleScale * band(distance, position, rippleBand), color: ink)
  }

  private static func hoverFrame(time: CGFloat, element: QrElement, touch: QrTouch) -> QrElementFrame {
    guard element.kind == .dot, touch.pressedAt >= 0 else { return QrElementFrame(scale: 1, color: ink) }
    let held = touch.releasedAt < 0 ? 1 : 1 - smoothstep((time - touch.releasedAt) / hoverRelease)
    let near = smoothstep(1 - hypot(element.x - touch.x, element.y - touch.y) / hoverRadius)
    return QrElementFrame(scale: 1 + hoverScale * near * held, color: ink)
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

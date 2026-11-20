import QuartzCore
import UIKit

// One CALayer per element, updated by a CADisplayLink on the main thread while something moves:
// always while loading, for the length of the ripple after a press. A frame only writes the layers
// whose value changed. The center badge is a React node drawn over this view, not here.
final class AnimatedQrCodeView: UIView {
  private static let finderModules = 7
  private static let dotRadiusRatio: CGFloat = 0.42
  private static let finderRingRadiusModules: CGFloat = 2.5
  // The shimmer is a slow sweep: 30 fps looks the same and costs half.
  private static let loadingFrameRate = CAFrameRateRange(minimum: 30, maximum: 60, preferred: 30)
  private static let inkColor = cgColor(QrAnimationTimeline.ink)
  private static let loadingColors = (0..<QrAnimationTimeline.loadingLevelCount).map {
    cgColor(QrAnimationTimeline.loadingColor(level: $0))
  }

  @objc var animation: NSString = "ripple" {
    didSet {
      guard animation != oldValue else { return }
      resetLayers()
      updateDisplayLink()
    }
  }
  // Off when the OS asks for reduced motion: the code is drawn still and presses do nothing.
  @objc var animated: Bool = true {
    didSet {
      guard animated != oldValue else { return }
      pressedAt = QrAnimationTimeline.neverPressed
      resetLayers()
      updateDisplayLink()
    }
  }
  // Each new value plays a press. JS counts confirmed presses: the view handles no touches itself.
  @objc var pressCount: NSInteger = 0 {
    didSet {
      if pressCount != oldValue, pressCount != 0 { press() }
    }
  }
  @objc var moduleCount: NSInteger = 0 {
    didSet {
      needsRebuild = true
      setNeedsLayout()
    }
  }
  @objc var dots: NSArray = [] {
    didSet {
      needsRebuild = true
      setNeedsLayout()
    }
  }

  private final class AnimatedLayer {
    let layer: CALayer
    let element: QrElement
    let colorsBorder: Bool
    // The last values written, to skip the layers that did not change.
    var shownLevel: Int?
    var shownScale: CGFloat = 1

    init(layer: CALayer, element: QrElement, colorsBorder: Bool) {
      self.layer = layer
      self.element = element
      self.colorsBorder = colorsBorder
    }

    func setColor(_ color: CGColor) {
      if colorsBorder {
        layer.borderColor = color
      } else {
        layer.backgroundColor = color
      }
    }
  }

  private var animatedLayers: [AnimatedLayer] = []
  private var pressedAt = QrAnimationTimeline.neverPressed
  private var needsRebuild = true
  private var builtBounds = CGRect.zero
  private var displayLink: CADisplayLink?
  private let startTime = CACurrentMediaTime()

  private var now: CGFloat { time(at: CACurrentMediaTime()) }

  private var isMoving: Bool {
    animated && QrAnimationTimeline.isMoving(animation: animation as String, time: now, pressedAt: pressedAt)
  }

  private func time(at mediaTime: CFTimeInterval) -> CGFloat {
    animated ? CGFloat(mediaTime - startTime) : 0
  }

  private func press() {
    guard animated else { return }
    pressedAt = now
    updateDisplayLink()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard needsRebuild || builtBounds != bounds else { return }
    rebuildLayers()
    render(time: now)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    // The link stopped while away: the layers may still show a frame of a ripple that ended since.
    if window != nil { render(time: now) }
    updateDisplayLink()
  }

  private func updateDisplayLink() {
    let shouldRun = window != nil && isMoving
    if shouldRun, displayLink == nil {
      let link = CADisplayLink(target: WeakTarget(self), selector: #selector(WeakTarget.tick(_:)))
      link.add(to: .main, forMode: .common)
      displayLink = link
    } else if !shouldRun {
      displayLink?.invalidate()
      displayLink = nil
    }
    displayLink?.preferredFrameRateRange = animation == "loading" ? Self.loadingFrameRate : .default
  }

  fileprivate func tick(_ link: CADisplayLink) {
    // The time the frame shows on screen, steady even when a callback runs late. The last frame
    // after a ripple is already back at rest.
    render(time: time(at: link.targetTimestamp))
    if !isMoving { updateDisplayLink() }
  }

  private func render(time: CGFloat) {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    // Loading only changes colors, ripple only scales.
    if animation == "loading" {
      for item in animatedLayers {
        let level = QrAnimationTimeline.loadingLevel(time: time, element: item.element)
        guard level != item.shownLevel else { continue }
        item.shownLevel = level
        item.setColor(Self.loadingColors[level])
      }
    } else {
      for item in animatedLayers {
        let scale = QrAnimationTimeline.rippleScale(time: time, element: item.element, pressedAt: pressedAt)
        guard scale != item.shownScale else { continue }
        item.shownScale = scale
        item.layer.transform = CATransform3DMakeScale(scale, scale, 1)
      }
    }
    CATransaction.commit()
  }

  // A new animation keeps the layers: it only needs them back at rest, in ink and unscaled.
  private func resetLayers() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for item in animatedLayers {
      item.setColor(Self.inkColor)
      item.shownLevel = nil
      item.layer.transform = CATransform3DIdentity
      item.shownScale = 1
    }
    CATransaction.commit()
    render(time: now)
  }

  private func rebuildLayers() {
    needsRebuild = false
    builtBounds = bounds
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }
    animatedLayers.forEach { $0.layer.removeFromSuperlayer() }
    animatedLayers = []
    guard moduleCount > Self.finderModules, bounds.width > 0 else { return }

    let count = CGFloat(moduleCount)
    let moduleSize = bounds.width / count
    let dotDiameter = moduleSize * Self.dotRadiusRatio * 2
    let dotInset = (moduleSize - dotDiameter) / 2
    func center(_ index: CGFloat) -> CGFloat { (index + 0.5) / count }

    let cells = dots.compactMap { ($0 as? NSNumber)?.intValue }
    for dotIndex in 0..<(cells.count / 2) {
      let row = CGFloat(cells[dotIndex * 2])
      let col = CGFloat(cells[dotIndex * 2 + 1])
      addLayer(
        frame: CGRect(x: col * moduleSize + dotInset, y: row * moduleSize + dotInset, width: dotDiameter, height: dotDiameter),
        cornerRadius: dotDiameter / 2,
        element: QrElement(x: center(col), y: center(row), kind: .dot)
      )
    }

    let finderModules = CGFloat(Self.finderModules)
    let finderEdge = count - finderModules
    for (row, col) in [(0, 0), (0, finderEdge), (finderEdge, 0)] {
      let finderOffset = (finderModules - 1) / 2
      let element = QrElement(x: center(col + finderOffset), y: center(row + finderOffset), kind: .finder)
      addLayer(
        frame: CGRect(x: col * moduleSize, y: row * moduleSize, width: finderModules * moduleSize, height: finderModules * moduleSize),
        cornerRadius: moduleSize * Self.finderRingRadiusModules,
        element: element,
        ringWidth: moduleSize
      )
      addLayer(
        frame: CGRect(x: (col + 2) * moduleSize, y: (row + 2) * moduleSize, width: 3 * moduleSize, height: 3 * moduleSize),
        cornerRadius: moduleSize,
        element: element
      )
    }
  }

  // With a ringWidth, the layer is a ring drawn by its border; without, a filled shape.
  private func addLayer(frame: CGRect, cornerRadius: CGFloat, element: QrElement, ringWidth: CGFloat? = nil) {
    let layer = CALayer()
    layer.frame = frame
    layer.cornerRadius = cornerRadius
    let item = AnimatedLayer(layer: layer, element: element, colorsBorder: ringWidth != nil)
    if let ringWidth { layer.borderWidth = ringWidth }
    item.setColor(Self.inkColor)
    self.layer.addSublayer(layer)
    animatedLayers.append(item)
  }

  private static func cgColor(_ rgb: QrRgb) -> CGColor {
    UIColor(red: rgb.r, green: rgb.g, blue: rgb.b, alpha: 1).cgColor
  }
}

// CADisplayLink retains its target: the proxy lets the view deallocate.
private final class WeakTarget: NSObject {
  private weak var view: AnimatedQrCodeView?

  init(_ view: AnimatedQrCodeView) {
    self.view = view
  }

  @objc func tick(_ link: CADisplayLink) {
    guard let view else {
      link.invalidate()
      return
    }
    view.tick(link)
  }
}

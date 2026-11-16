import QuartzCore
import UIKit

// One CALayer per element, updated by a CADisplayLink on the main thread while something moves:
// always while loading, for the length of the ripple after a press.
// The center badge is a React node drawn over this view, not here.
final class AnimatedQrCodeView: UIView {
  private static let finderModules = 7
  private static let dotRadiusRatio: CGFloat = 0.42
  private static let finderRingRadiusModules: CGFloat = 2.5

  @objc var animation: NSString = "ripple" {
    didSet {
      guard animation != oldValue else { return }
      // Fresh layers start from the colors and scale of the new animation.
      needsRebuild = true
      setNeedsLayout()
      updateDisplayLink()
    }
  }
  // Off when the OS asks for reduced motion: the code is drawn still and presses do nothing.
  @objc var animated: Bool = true {
    didSet {
      guard animated != oldValue else { return }
      pressedAt = QrAnimationTimeline.neverPressed
      needsRebuild = true
      setNeedsLayout()
      updateDisplayLink()
    }
  }
  // Each new value plays a press, e.g. from a separate button.
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

  private struct AnimatedLayer {
    let layer: CALayer
    let element: QrElement
    let colorsBorder: Bool
  }

  private var animatedLayers: [AnimatedLayer] = []
  private var pressedAt = QrAnimationTimeline.neverPressed
  private var needsRebuild = true
  private var builtBounds = CGRect.zero
  private var displayLink: CADisplayLink?
  private let startTime = CACurrentMediaTime()

  private var now: CGFloat { animated ? CGFloat(CACurrentMediaTime() - startTime) : 0 }

  private var isMoving: Bool {
    animated && QrAnimationTimeline.isMoving(animation: animation as String, time: now, pressedAt: pressedAt)
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
    press()
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
  }

  fileprivate func tick() {
    // The last frame after a ripple is already back at rest.
    render(time: now)
    if !isMoving { updateDisplayLink() }
  }

  private func render(time: CGFloat) {
    let animationName = animation as String
    let animatesColor = animationName == "loading"

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for item in animatedLayers {
      let frame = QrAnimationTimeline.frame(animation: animationName, time: time, element: item.element, pressedAt: pressedAt)
      // Loading only changes colors, ripple only scales.
      if animatesColor {
        let color = UIColor(red: frame.color.r, green: frame.color.g, blue: frame.color.b, alpha: 1).cgColor
        if item.colorsBorder {
          item.layer.borderColor = color
        } else {
          item.layer.backgroundColor = color
        }
      } else {
        item.layer.transform = CATransform3DMakeScale(frame.scale, frame.scale, 1)
      }
    }
    CATransaction.commit()
  }

  private func rebuildLayers() {
    needsRebuild = false
    builtBounds = bounds
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
      let ring = addLayer(
        frame: CGRect(x: col * moduleSize, y: row * moduleSize, width: finderModules * moduleSize, height: finderModules * moduleSize),
        cornerRadius: moduleSize * Self.finderRingRadiusModules,
        element: element,
        colorsBorder: true
      )
      ring.borderWidth = moduleSize
      addLayer(
        frame: CGRect(x: (col + 2) * moduleSize, y: (row + 2) * moduleSize, width: 3 * moduleSize, height: 3 * moduleSize),
        cornerRadius: moduleSize,
        element: element
      )
    }
  }

  @discardableResult
  private func addLayer(frame: CGRect, cornerRadius: CGFloat, element: QrElement, colorsBorder: Bool = false) -> CALayer {
    let layer = CALayer()
    layer.frame = frame
    layer.cornerRadius = cornerRadius
    let ink = QrAnimationTimeline.ink
    let inkColor = UIColor(red: ink.r, green: ink.g, blue: ink.b, alpha: 1).cgColor
    if colorsBorder {
      layer.borderColor = inkColor
    } else {
      layer.backgroundColor = inkColor
    }
    self.layer.addSublayer(layer)
    animatedLayers.append(AnimatedLayer(layer: layer, element: element, colorsBorder: colorsBorder))
    return layer
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
    view.tick()
  }
}

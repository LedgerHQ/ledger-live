import QuartzCore
import UIKit

// One CALayer per element, updated every frame by a CADisplayLink on the main thread.
// The center badge is a React node drawn over this view, not here.
final class AnimatedQrCodeView: UIView {
  private static let finderModules = 7
  private static let dotRadiusRatio: CGFloat = 0.42
  private static let finderRingRadiusModules: CGFloat = 2.5

  @objc var animation: NSString = "shimmer"
  @objc var autoPlay: Bool = false
  @objc var moduleCount: NSInteger = 0 { didSet { needsRebuild = true } }
  @objc var dots: NSArray = [] { didSet { needsRebuild = true } }

  private struct AnimatedLayer {
    let layer: CALayer
    let element: QrElement
    let colorsBorder: Bool
  }

  private var animatedLayers: [AnimatedLayer] = []
  private var touch = QrTouch.none
  private var needsRebuild = true
  private var builtBounds = CGRect.zero
  private var displayLink: CADisplayLink?
  private var startTime: CFTimeInterval = 0

  private var now: CGFloat { CGFloat(CACurrentMediaTime() - startTime) }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
    guard let point = normalizedLocation(touches) else { return }
    touch = QrTouch(x: point.x, y: point.y, pressedAt: now, releasedAt: -1)
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesEnded(touches, with: event)
    touch.releasedAt = now
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesCancelled(touches, with: event)
    touch.releasedAt = now
  }

  private func normalizedLocation(_ touches: Set<UITouch>) -> CGPoint? {
    guard let location = touches.first?.location(in: self), bounds.width > 0 else { return nil }
    return CGPoint(x: location.x / bounds.width, y: location.y / bounds.height)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if needsRebuild || builtBounds != bounds { rebuildLayers() }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      displayLink?.invalidate()
      displayLink = nil
    } else if displayLink == nil {
      startTime = CACurrentMediaTime()
      let link = CADisplayLink(target: WeakTarget(self), selector: #selector(WeakTarget.tick(_:)))
      link.add(to: .main, forMode: .common)
      displayLink = link
    }
  }

  fileprivate func tick(_ link: CADisplayLink) {
    let time = CGFloat(link.timestamp - startTime)
    let animationName = animation as String
    if autoPlay { touch = QrAnimationTimeline.autoTouch(animation: animationName, time: time, touch: touch) }
    let animatesColor = animationName == "shimmer"

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for animated in animatedLayers {
      let frame = QrAnimationTimeline.frame(animation: animationName, time: time, element: animated.element, touch: touch)
      // Each animation only animates what it changes, like the Reanimated version.
      if animatesColor {
        let color = UIColor(red: frame.color.r, green: frame.color.g, blue: frame.color.b, alpha: 1).cgColor
        if animated.colorsBorder {
          animated.layer.borderColor = color
        } else {
          animated.layer.backgroundColor = color
        }
      } else {
        animated.layer.transform = CATransform3DMakeScale(frame.scale, frame.scale, 1)
      }
    }
    CATransaction.commit()
  }

  private func rebuildLayers() {
    needsRebuild = false
    builtBounds = bounds
    animatedLayers.forEach { $0.layer.removeFromSuperlayer() }
    animatedLayers = []
    guard moduleCount > 1, bounds.width > 0 else { return }

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
    view.tick(link)
  }
}

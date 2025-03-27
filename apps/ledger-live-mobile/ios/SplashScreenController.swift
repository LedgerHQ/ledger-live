//
//  SplashScreenController.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 17/03/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import Foundation
import ImageIO
import UIKit

class SplashScreenController: UIViewController {
  var displayLink: CADisplayLink?
  var startTime: CFTimeInterval = 0
  var gifImages: [UIImage] = []
  var gifDuration: TimeInterval = 0
  var imageView: UIImageView?
  var gifCompletedOnce: Bool = false
  var onGifCompletion: (() -> Void)?

  override func viewDidLoad() {
    super.viewDidLoad()
    self.view?.backgroundColor = UIColor(
      red: 12 / 255.0, green: 12 / 255.0, blue: 12 / 255.0, alpha: 1.0)

    if let gifPath = Bundle.main.path(forResource: "logo", ofType: "gif"),
      let gifData = NSData(contentsOfFile: gifPath),
      let gifImage = UIImage.gif(data: gifData as Data)
    {
      imageView = UIImageView(image: gifImage)
      imageView?.translatesAutoresizingMaskIntoConstraints = false
      self.view.addSubview(imageView!)

      NSLayoutConstraint.activate([
        imageView!.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
        imageView!.centerYAnchor.constraint(equalTo: self.view.centerYAnchor),
        imageView!.heightAnchor.constraint(equalToConstant: 42),
        imageView!.widthAnchor.constraint(equalToConstant: 207),
      ])

      if let source = CGImageSourceCreateWithData(gifData, nil) {
        let count = CGImageSourceGetCount(source)
        for i in 0..<count {
          if let image = CGImageSourceCreateImageAtIndex(source, i, nil) {
            gifImages.append(UIImage(cgImage: image))
          }
          let frameProperties =
            CGImageSourceCopyPropertiesAtIndex(source, i, nil) as? [String: Any]
          let gifProperties =
            frameProperties?[kCGImagePropertyGIFDictionary as String]
            as? [String: Any]
          if let delayTime = gifProperties?[
            kCGImagePropertyGIFUnclampedDelayTime as String] as? Double
          {
            gifDuration += delayTime
          } else if let delayTime = gifProperties?[
            kCGImagePropertyGIFDelayTime as String] as? Double
          {
            gifDuration += delayTime
          }
        }
      }

      displayLink = CADisplayLink(target: self, selector: #selector(updateGif))
      displayLink?.add(to: .main, forMode: .default)
      startTime = CACurrentMediaTime()
    }
  }

  @objc func updateGif() {
    let elapsedTime = CACurrentMediaTime() - startTime
    if elapsedTime > gifDuration {
      gifCompletedOnce = true
      displayLink?.invalidate()
      displayLink = nil
      onGifCompletion?()
      return
    }

    let frameIndex = Int((elapsedTime / gifDuration) * Double(gifImages.count))
    imageView?.image = gifImages[frameIndex]
  }
}

extension UIImage {
  public class func gif(data: Data) -> UIImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
      print("SwiftGif: Source for the image does not exist")
      return nil
    }

    return UIImage.animatedImageWithSource(source)
  }

  class func animatedImageWithSource(_ source: CGImageSource) -> UIImage? {
    let count = CGImageSourceGetCount(source)
    var images = [CGImage]()
    var duration: TimeInterval = 0

    for i in 0..<count {
      if let image = CGImageSourceCreateImageAtIndex(source, i, nil) {
        images.append(image)
      }

      let frameProperties =
        CGImageSourceCopyPropertiesAtIndex(source, i, nil) as? [String: Any]
      let gifProperties =
        frameProperties?[kCGImagePropertyGIFDictionary as String]
        as? [String: Any]

      if let delayTime = gifProperties?[
        kCGImagePropertyGIFUnclampedDelayTime as String] as? Double
      {
        duration += delayTime
      } else if let delayTime = gifProperties?[
        kCGImagePropertyGIFDelayTime as String] as? Double
      {
        duration += delayTime
      }
    }

    let animation = UIImage.animatedImage(
      with: images.map { UIImage(cgImage: $0) }, duration: duration)

    return animation
  }
}

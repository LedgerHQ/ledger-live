package com.ledger.live.fabric

import android.graphics.RectF
import android.view.View
import android.view.ViewParent

/**
 * Transform-aware measurement utility from React Native PR #51835.
 * 
 * This utility measures views including their animation transforms by reading
 * the actual View.getMatrix() from the native view hierarchy on the UI thread.
 * 
 * This solves the issue where Pressability hit testing fails during animations
 * because the shadow tree layout doesn't include transform values.
 */
public object MeasureAsyncUtil {
  private val mBoundingBox = RectF()

  /**
   * Measure a view relative to a root view, including all transforms.
   * 
   * Output buffer will be {x, y, width, height} in pixels.
   * 
   * @param rootView The root view to measure relative to (usually the surface root)
   * @param viewToMeasure The target view to measure
   * @param outputBuffer Int array of size 4 to receive [x, y, width, height]
   */
  public fun measure(rootView: View, viewToMeasure: View, outputBuffer: IntArray) {
    computeBoundingBox(rootView, outputBuffer)
    val rootX = outputBuffer[0]
    val rootY = outputBuffer[1]
    computeBoundingBox(viewToMeasure, outputBuffer)
    outputBuffer[0] -= rootX
    outputBuffer[1] -= rootY
  }

  /**
   * Measure a view in absolute window coordinates, including all transforms.
   * 
   * This is used for Pressability hit testing where we need absolute screen coordinates.
   * 
   * Output buffer will be {x, y, width, height} in pixels.
   * 
   * @param view The view to measure
   * @param outputBuffer Int array of size 4 to receive [x, y, width, height]
   */
  public fun measureInWindow(view: View, outputBuffer: IntArray) {
    computeBoundingBox(view, outputBuffer)
  }

  /**
   * Compute the bounding box of a view in window coordinates, including transforms.
   * 
   * This walks up the view hierarchy applying:
   * - View transforms (from animations)
   * - Parent transforms (inherited)
   * - Scroll offsets
   * - View positions
   */
  private fun computeBoundingBox(view: View, outputBuffer: IntArray) {
    mBoundingBox.set(0f, 0f, view.width.toFloat(), view.height.toFloat())
    mapRectFromViewToWindowCoords(view, mBoundingBox)

    outputBuffer[0] = Math.round(mBoundingBox.left)
    outputBuffer[1] = Math.round(mBoundingBox.top)
    outputBuffer[2] = Math.round(mBoundingBox.right - mBoundingBox.left)
    outputBuffer[3] = Math.round(mBoundingBox.bottom - mBoundingBox.top)
  }

  /**
   * Map a rect from view-local coordinates to window coordinates.
   * 
   * This is the KEY METHOD that includes transform matrices!
   * 
   * The matrix from View.getMatrix() includes all transforms applied to the view,
   * including those from React Native Reanimated animations.
   */
  private fun mapRectFromViewToWindowCoords(view: View, rect: RectF) {
    // Apply the view's own transform matrix (includes animations!)
    var matrix = view.getMatrix()
    if (!matrix.isIdentity) {
      matrix.mapRect(rect)
    }

    // Offset by view's position
    rect.offset(view.left.toFloat(), view.top.toFloat())

    // Walk up the view hierarchy applying parent transforms and offsets
    var parent: ViewParent? = view.parent
    while (parent is View) {
      val parentView = parent as View

      // Account for scroll offsets
      rect.offset(-parentView.scrollX.toFloat(), -parentView.scrollY.toFloat())

      // Apply parent's transform matrix (includes parent animations!)
      matrix = parentView.getMatrix()
      if (!matrix.isIdentity) {
        matrix.mapRect(rect)
      }

      // Offset by parent's position
      rect.offset(parentView.left.toFloat(), parentView.top.toFloat())

      parent = parentView.parent
    }
  }
}


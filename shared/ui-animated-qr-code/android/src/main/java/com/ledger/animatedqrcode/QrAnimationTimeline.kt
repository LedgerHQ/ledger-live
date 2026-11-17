package com.ledger.animatedqrcode

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

// Mirror of src/animationTimeline.ts: change the three together so both platforms play the same
// animation. The center badge is not drawn natively, so only dots and finders live here. A frame is
// split into a loading color and a ripple scale, plain values that allocate nothing per frame.
enum class QrElementKind { DOT, FINDER }

// x and y: center of the element, in fractions of the QR side (0 to 1).
class QrElement(x: Float, y: Float, val kind: QrElementKind) {
    // From the element's center to the code's, in fractions of the QR side. Computed once, not per frame.
    val distanceToCenter = hypot(x - 0.5f, y - 0.5f)
}

object QrAnimationTimeline {
    const val NEVER_PRESSED = -1f
    const val INK = 0x111111 or (0xFF shl 24)
    private const val SKELETON_GRAY = 0xE9
    private const val SHIMMER_GRAY = 0xF7

    // One color per 8-bit gray from the skeleton to the shimmer: no color mixing per frame.
    private val LOADING_COLORS = IntArray(SHIMMER_GRAY - SKELETON_GRAY + 1) { level -> gray(SKELETON_GRAY + level) }

    private const val SHIMMER_BAND = 0.3f
    private const val SHIMMER_SWEEP = 1.2f

    private const val RIPPLE_DELAY = 0.1f
    private const val RIPPLE_SWEEP = 0.9f
    private const val RIPPLE_BAND = 0.12f
    private const val RIPPLE_SCALE = 0.4f
    private val RIPPLE_REACH = sqrt(0.5f)

    fun loadingColor(time: Float, element: QrElement): Int {
        val sweep = (time % SHIMMER_SWEEP) / SHIMMER_SWEEP
        val position = sweep * (1 + 2 * SHIMMER_BAND) - SHIMMER_BAND
        val shine = band(element.distanceToCenter / RIPPLE_REACH, position, SHIMMER_BAND)
        return LOADING_COLORS[(shine * (LOADING_COLORS.size - 1)).roundToInt()]
    }

    fun rippleScale(time: Float, element: QrElement, pressedAt: Float): Float {
        val age = time - pressedAt
        if (pressedAt < 0 || age < 0 || element.kind != QrElementKind.DOT) return 1f
        val progress = (age - RIPPLE_DELAY) / RIPPLE_SWEEP
        if (progress < 0 || progress > 1) return 1f
        val position = progress * (RIPPLE_REACH + RIPPLE_BAND)
        return 1 + RIPPLE_SCALE * band(element.distanceToCenter, position, RIPPLE_BAND)
    }

    // Native only: the view stops redrawing while nothing moves.
    fun isMoving(animation: String, time: Float, pressedAt: Float): Boolean =
        animation == "loading" || (pressedAt >= 0 && time - pressedAt <= RIPPLE_DELAY + RIPPLE_SWEEP)

    // 1 when value sits on position, 0 once it is width away.
    private fun band(value: Float, position: Float, width: Float): Float =
        smoothstep(1 - abs(value - position) / width)

    private fun smoothstep(x: Float): Float {
        val c = min(1f, max(0f, x))
        return c * c * (3 - 2 * c)
    }

    private fun gray(level: Int): Int = (0xFF shl 24) or (level shl 16) or (level shl 8) or level
}

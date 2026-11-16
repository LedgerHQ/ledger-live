package com.ledger.animatedqrcode

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

// Mirror of src/animationTimeline.ts: change the three together so both platforms play the same
// animation. The center badge is not drawn natively, so only dots and finders live here.
enum class QrElementKind { DOT, FINDER }

// Center of the element, in fractions of the QR side (0 to 1).
class QrElement(val x: Float, val y: Float, val kind: QrElementKind)

data class QrElementFrame(val scale: Float, val color: Int)

object QrAnimationTimeline {
    const val NEVER_PRESSED = -1f
    const val INK = 0x111111 or (0xFF shl 24)
    private const val SKELETON = 0xE9E9E9
    private const val SHIMMER = 0xF7F7F7

    private const val SHIMMER_BAND = 0.3f
    private const val SHIMMER_SWEEP = 1.2f

    private const val RIPPLE_DELAY = 0.1f
    private const val RIPPLE_SWEEP = 0.9f
    private const val RIPPLE_BAND = 0.12f
    private const val RIPPLE_SCALE = 0.4f
    private val RIPPLE_REACH = sqrt(0.5f)

    fun frame(animation: String, time: Float, element: QrElement, pressedAt: Float): QrElementFrame =
        if (animation == "loading") loadingFrame(time, element) else copyFrame(time, element, pressedAt)

    // Native only: the view stops its frame callbacks while nothing moves.
    fun isMoving(animation: String, time: Float, pressedAt: Float): Boolean =
        animation == "loading" || (pressedAt >= 0 && time - pressedAt <= RIPPLE_DELAY + RIPPLE_SWEEP)

    private fun loadingFrame(time: Float, element: QrElement): QrElementFrame {
        val sweep = (time % SHIMMER_SWEEP) / SHIMMER_SWEEP
        val position = sweep * (1 + 2 * SHIMMER_BAND) - SHIMMER_BAND
        val shine = band(distanceToCenter(element) / RIPPLE_REACH, position, SHIMMER_BAND)
        return QrElementFrame(1f, mix(SKELETON, SHIMMER, shine))
    }

    private fun copyFrame(time: Float, element: QrElement, pressedAt: Float): QrElementFrame {
        val age = time - pressedAt
        if (pressedAt < 0 || age < 0 || element.kind != QrElementKind.DOT) return QrElementFrame(1f, INK)
        val progress = (age - RIPPLE_DELAY) / RIPPLE_SWEEP
        if (progress < 0 || progress > 1) return QrElementFrame(1f, INK)
        val position = progress * (RIPPLE_REACH + RIPPLE_BAND)
        val grow = band(distanceToCenter(element), position, RIPPLE_BAND)
        return QrElementFrame(1 + RIPPLE_SCALE * grow, INK)
    }

    private fun distanceToCenter(element: QrElement): Float = hypot(element.x - 0.5f, element.y - 0.5f)

    // 1 when value sits on position, 0 once it is width away.
    private fun band(value: Float, position: Float, width: Float): Float =
        smoothstep(1 - abs(value - position) / width)

    private fun smoothstep(x: Float): Float {
        val c = min(1f, max(0f, x))
        return c * c * (3 - 2 * c)
    }

    private fun mix(from: Int, to: Int, amount: Float): Int {
        fun channel(shift: Int): Int {
            val a = (from shr shift) and 0xFF
            val b = (to shr shift) and 0xFF
            return (a + (b - a) * amount).roundToInt()
        }
        return (0xFF shl 24) or (channel(16) shl 16) or (channel(8) shl 8) or channel(0)
    }
}

package com.ledger.animatedqrcode

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

// Mirror of src/animationTimeline.ts: change both together so the benchmark compares like for like.
// The center badge is not drawn natively, so only dots and finders live here.
enum class QrElementKind { DOT, FINDER }

// Center of the element, in fractions of the QR side (0 to 1).
class QrElement(val x: Float, val y: Float, val kind: QrElementKind)

// The finger: position in fractions of the side, times (s) it went down and up.
// pressedAt < 0: never pressed. releasedAt < 0: still down.
data class QrTouch(val x: Float, val y: Float, val pressedAt: Float, val releasedAt: Float) {
    companion object {
        val NONE = QrTouch(0f, 0f, -1f, -1f)
    }
}

data class QrElementFrame(val scale: Float, val color: Int)

object QrAnimationTimeline {
    const val INK = 0x111111 or (0xFF shl 24)
    private const val SKELETON = 0xE9E9E9
    private const val SHIMMER = 0xF7F7F7

    private const val SHIMMER_BAND = 0.3f
    private const val SHIMMER_SWEEP = 1.2f
    private const val LOADING_END = 4.8f
    private const val FADE_IN_END = 5.2f
    private const val HOLD_END = 6.7f
    private const val SHIMMER_PERIOD = 7.2f

    private const val RIPPLE_DELAY = 0.1f
    private const val RIPPLE_SWEEP = 0.9f
    private const val RIPPLE_BAND = 0.12f
    private const val RIPPLE_SCALE = 0.4f
    private val RIPPLE_REACH = sqrt(0.5f)
    private const val AUTO_PRESS_PERIOD = 1.6f
    private const val AUTO_HOLD = 0.8f

    private const val HOVER_RADIUS = 0.14f
    private const val HOVER_SCALE = 0.8f
    private const val HOVER_RELEASE = 0.25f

    fun frame(animation: String, time: Float, element: QrElement, touch: QrTouch): QrElementFrame =
        when (animation) {
            "shimmer" -> shimmerFrame(time, element)
            "copy" -> copyFrame(time, element, touch)
            else -> hoverFrame(time, element, touch)
        }

    // With auto play on, a press every AUTO_PRESS_PERIOD: a tap in the center for copy, an AUTO_HOLD
    // hold somewhere on the code for hover. A release time in the future means the finger is still down.
    fun autoTouch(animation: String, time: Float, touch: QrTouch): QrTouch {
        if (animation == "shimmer") return touch
        val due = touch.pressedAt < 0 || time - touch.pressedAt >= AUTO_PRESS_PERIOD
        if (!due) return touch
        if (animation == "copy") return QrTouch(0.5f, 0.5f, time, time)
        return QrTouch(
            0.5f + 0.3f * sin(time * 2.3f),
            0.5f + 0.3f * sin(time * 1.7f + 0.7f),
            time,
            time + AUTO_HOLD,
        )
    }

    private fun shimmerReveal(time: Float): Float {
        val local = time % SHIMMER_PERIOD
        return when {
            local < LOADING_END -> 0f
            local < FADE_IN_END -> smoothstep((local - LOADING_END) / (FADE_IN_END - LOADING_END))
            local < HOLD_END -> 1f
            else -> 1f - smoothstep((local - HOLD_END) / (SHIMMER_PERIOD - HOLD_END))
        }
    }

    private fun shimmerFrame(time: Float, element: QrElement): QrElementFrame {
        val local = time % SHIMMER_PERIOD
        if (local < LOADING_END) {
            val sweep = (local % SHIMMER_SWEEP) / SHIMMER_SWEEP
            val position = sweep * (1 + 2 * SHIMMER_BAND) - SHIMMER_BAND
            return QrElementFrame(1f, mix(SKELETON, SHIMMER, band(hypot(element.x - 0.5f, element.y - 0.5f) / RIPPLE_REACH, position, SHIMMER_BAND)))
        }
        return QrElementFrame(1f, mix(SKELETON, INK, shimmerReveal(time)))
    }

    private fun copyFrame(time: Float, element: QrElement, touch: QrTouch): QrElementFrame {
        val age = time - touch.pressedAt
        if (touch.pressedAt < 0 || age < 0 || element.kind != QrElementKind.DOT) return QrElementFrame(1f, INK)
        val progress = (age - RIPPLE_DELAY) / RIPPLE_SWEEP
        if (progress < 0 || progress > 1) return QrElementFrame(1f, INK)
        val position = progress * (RIPPLE_REACH + RIPPLE_BAND)
        val distance = hypot(element.x - 0.5f, element.y - 0.5f)
        return QrElementFrame(1 + RIPPLE_SCALE * band(distance, position, RIPPLE_BAND), INK)
    }

    private fun hoverFrame(time: Float, element: QrElement, touch: QrTouch): QrElementFrame {
        if (element.kind != QrElementKind.DOT || touch.pressedAt < 0) return QrElementFrame(1f, INK)
        val held = if (touch.releasedAt < 0) 1f else 1 - smoothstep((time - touch.releasedAt) / HOVER_RELEASE)
        val near = smoothstep(1 - hypot(element.x - touch.x, element.y - touch.y) / HOVER_RADIUS)
        return QrElementFrame(1 + HOVER_SCALE * near * held, INK)
    }

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

package com.ledger.animatedqrcode

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.os.SystemClock
import android.view.View

// Every element drawn with Canvas in onDraw, which asks for the next vsync while something moves:
// always while loading, for the length of the ripple after a press.
// The center badge is a React node drawn over this view, not here.
class AnimatedQrCodeView(context: Context) : View(context) {
    private companion object {
        const val FINDER_MODULES = 7
        const val DOT_RADIUS_RATIO = 0.42f
        const val FINDER_RING_RADIUS_MODULES = 2.5f
    }

    private class Element(
        val rect: RectF,
        val cornerRadius: Float,
        val element: QrElement,
        val ring: Boolean,
    )

    var animation: String = "ripple"
        set(value) {
            if (value == field) return
            field = value
            invalidate()
        }
    // Off when the OS asks for reduced motion: the code is drawn still and presses do nothing.
    var animated: Boolean = true
        set(value) {
            if (value == field) return
            field = value
            pressedAt = QrAnimationTimeline.NEVER_PRESSED
            invalidate()
        }
    // Each new value plays a press. JS counts confirmed presses: the view handles no touches itself.
    var pressCount: Int = 0
        set(value) {
            val changed = value != field
            field = value
            if (changed && value != 0) press()
        }
    var moduleCount: Int = 0
        set(value) { field = value; needsRebuild = true; invalidate() }
    var dots: IntArray = IntArray(0)
        set(value) { field = value; needsRebuild = true; invalidate() }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private var elements: List<Element> = emptyList()
    private var needsRebuild = true
    private var builtWidth = 0
    // The clock of drawingTime, the vsync time of the frame being drawn.
    private val startMillis = SystemClock.uptimeMillis()
    private var pressedAt = QrAnimationTimeline.NEVER_PRESSED

    private fun timeAt(millis: Long): Float = if (animated) (millis - startMillis) / 1000f else 0f

    private fun isMoving(time: Float): Boolean = animated && QrAnimationTimeline.isMoving(animation, time, pressedAt)

    private fun press() {
        if (!animated) return
        pressedAt = timeAt(SystemClock.uptimeMillis())
        invalidate()
    }

    // Nothing redraws while detached: the first frame back drops what a ripple left mid-way.
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (needsRebuild || builtWidth != width) rebuildElements()
        val time = timeAt(drawingTime)
        val loading = animation == "loading"

        for (element in elements) {
            val paint = if (element.ring) ringPaint else fillPaint
            // Loading only changes colors, ripple only scales dots.
            paint.color = if (loading) QrAnimationTimeline.loadingColor(time, element.element) else QrAnimationTimeline.INK
            val rect = element.rect
            if (element.element.kind == QrElementKind.DOT) {
                val scale = if (loading) 1f else QrAnimationTimeline.rippleScale(time, element.element, pressedAt)
                canvas.drawCircle(rect.centerX(), rect.centerY(), element.cornerRadius * scale, paint)
            } else {
                canvas.drawRoundRect(rect, element.cornerRadius, element.cornerRadius, paint)
            }
        }

        // The last frame after a ripple is already back at rest.
        if (isMoving(time)) postInvalidateOnAnimation()
    }

    private fun rebuildElements() {
        needsRebuild = false
        builtWidth = width
        if (moduleCount <= FINDER_MODULES || width == 0) {
            elements = emptyList()
            return
        }

        val count = moduleCount.toFloat()
        val moduleSize = width / count
        val dotDiameter = moduleSize * DOT_RADIUS_RATIO * 2
        val dotInset = (moduleSize - dotDiameter) / 2
        fun center(index: Float) = (index + 0.5f) / count
        val built = ArrayList<Element>(dots.size / 2 + 6)

        for (dotIndex in 0 until dots.size / 2) {
            val row = dots[dotIndex * 2].toFloat()
            val col = dots[dotIndex * 2 + 1].toFloat()
            val left = col * moduleSize + dotInset
            val top = row * moduleSize + dotInset
            built.add(
                Element(
                    RectF(left, top, left + dotDiameter, top + dotDiameter),
                    dotDiameter / 2,
                    QrElement(center(col), center(row), QrElementKind.DOT),
                    ring = false,
                ),
            )
        }

        val finderEdge = (moduleCount - FINDER_MODULES).toFloat()
        ringPaint.strokeWidth = moduleSize
        for ((row, col) in listOf(0f to 0f, 0f to finderEdge, finderEdge to 0f)) {
            val finderOffset = (FINDER_MODULES - 1) / 2f
            val finder = QrElement(center(col + finderOffset), center(row + finderOffset), QrElementKind.FINDER)
            // A stroke is centered on its path: inset by half a module so the ring stays 7 modules wide.
            val half = moduleSize / 2
            built.add(
                Element(
                    RectF(
                        col * moduleSize + half,
                        row * moduleSize + half,
                        (col + FINDER_MODULES) * moduleSize - half,
                        (row + FINDER_MODULES) * moduleSize - half,
                    ),
                    moduleSize * (FINDER_RING_RADIUS_MODULES - 0.5f),
                    finder,
                    ring = true,
                ),
            )
            built.add(
                Element(
                    RectF((col + 2) * moduleSize, (row + 2) * moduleSize, (col + 5) * moduleSize, (row + 5) * moduleSize),
                    moduleSize,
                    finder,
                    ring = false,
                ),
            )
        }
        elements = built
    }
}

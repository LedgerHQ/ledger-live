package com.ledger.uiglow

import kotlin.math.min

/**
 * The opacity of one glow (0 = hidden, 1 = shown), moving toward a target in FADE_SECONDS.
 *
 * Two threads use it:
 * - UI thread: request() a new target, with a start time (0 = jump at once).
 * - GL thread: step() on each frame, then read `value`.
 * `version` tells the GL thread that a new request came in.
 */
internal class GlowFade {
  // Written by the UI thread. @Volatile: the GL thread sees each write at once.
  @Volatile var target = 0f
    private set
  @Volatile private var startNanos = 0L // 0 = jump at once
  @Volatile private var version = 0
  /** False until the first request. */
  var hasRequest = false
    private set

  // GL thread only.
  var value = 0f
    private set
  private var from = 0f
  private var seenVersion = -1
  private var isRunning = false

  /** UI thread. Fade to `newTarget`, starting at `start` (System.nanoTime), or at once if 0. */
  fun request(newTarget: Float, start: Long) {
    target = newTarget
    startNanos = start
    hasRequest = true
    version++
  }

  /** UI thread. Jump to the current target (reduce motion was turned on). */
  fun finish() {
    if (hasRequest) request(target, 0L)
  }

  /** GL thread, once per frame. */
  fun step(now: Long) {
    if (version != seenVersion) {
      seenVersion = version
      if (startNanos == 0L) {
        value = target
        isRunning = false
        return
      }
      from = value
      isRunning = true
    }
    if (!isRunning || now < startNanos) return // still waiting for `delayMs`
    val progress = min(1.0, (now - startNanos) / 1e9 / FADE_SECONDS)
    value = from + (target - from) * progress.toFloat()
    if (progress >= 1.0) isRunning = false
  }

  companion object {
    /** One glow coming or going. Same as GLOW_FADE_MS in JS. Linear: the shader eases it. */
    const val FADE_SECONDS = 1.0
  }
}

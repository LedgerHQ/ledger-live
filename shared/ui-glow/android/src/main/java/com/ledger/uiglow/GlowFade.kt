package com.ledger.uiglow

import kotlin.math.min

/**
 * The opacity of one glow (0 = hidden, 1 = shown), moving toward a target in FADE_SECONDS.
 *
 * Two threads use it:
 * - UI thread: request() a new target, with a start time (0 = jump at once).
 * - GL thread: step() on each frame, then read `value`.
 * A request is one object, swapped in one write, so the GL thread never sees half of one.
 */
internal class GlowFade {
  private class Request(val target: Float, val startNanos: Long) // startNanos 0 = jump at once

  /** Written by the UI thread. @Volatile: the GL thread sees each new request at once. */
  @Volatile private var latest: Request? = null

  /** The last requested target (UI thread). */
  val target: Float
    get() = latest?.target ?: 0f
  /** False until the first request. */
  val hasRequest: Boolean
    get() = latest != null

  // GL thread only.
  var value = 0f
    private set
  private var from = 0f
  private var running: Request? = null // the request being stepped
  private var seen: Request? = null

  /** UI thread. Fade to `newTarget`, starting at `start` (System.nanoTime), or at once if 0. */
  fun request(newTarget: Float, start: Long) {
    latest = Request(newTarget, start)
  }

  /** UI thread. Jump to the current target (reduce motion was turned on). */
  fun finish() {
    latest?.let { request(it.target, 0L) }
  }

  /** GL thread, once per frame. */
  fun step(now: Long) {
    val request = latest ?: return // read once: this frame uses one request only
    if (request !== seen) {
      seen = request
      if (request.startNanos == 0L) {
        value = request.target
        running = null
        return
      }
      from = value
      running = request
    }
    val fade = running ?: return
    if (now < fade.startNanos) return // still waiting for `delayMs`
    val progress = min(1.0, (now - fade.startNanos) / 1e9 / FADE_SECONDS)
    value = from + (fade.target - from) * progress.toFloat()
    if (progress >= 1.0) running = null
  }

  companion object {
    /** One glow coming or going. Same as GLOW_FADE_MS in JS. Linear: the shader eases it. */
    const val FADE_SECONDS = 1.0
  }
}

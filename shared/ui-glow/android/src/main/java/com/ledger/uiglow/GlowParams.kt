package com.ledger.uiglow

/** The design params of the glow (GlowParams in JS), set one by one by the typed props. */
data class GlowParams(
    val intensity: Float = 0f,
    val opacity: Float = 0f,
    val grain: Float = 0f,
    val grainSize: Float = 0f,
    val chroma: Float = 0f,
    val softness: Float = 0f,
    val width: Float = 0f,
    val reach: Float = 0f,
    val topReach: Float = 0f,
    val dark: Float = 0f,
    val spreadX: Float = 0f,
    val balance: Float = 0f,
    val contrast: Float = 0f,
)

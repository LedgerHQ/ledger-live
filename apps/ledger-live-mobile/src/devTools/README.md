# DevTools Integration

This directory contains the React Native DevTools integration using [Rozenite](https://www.rozenite.dev/), a plug-and-play DevTools panel framework for React Native applications.

## Overview

Rozenite provides a unified DevTools experience with plug-and-play panels that automatically appear in React Native DevTools. All panels live inside React Native DevTools with no extra windows, servers, or browser tabs required.

## Current Implementation

The DevTools are implemented in `useDevTools.ts` and include three main panels:

### 1. Network Activity Monitor

- **Plugin**: `@rozenite/network-activity-plugin`
- **Purpose**: Monitors and inspects HTTP network requests in real-time
- **Configuration**: Currently enabled for HTTP requests only (WebSocket and SSE disabled)
- **Use Case**: Debug API calls, monitor network performance, and troubleshoot connectivity issues

### 2. React Navigation Debugger

- **Plugin**: `@rozenite/react-navigation-plugin`
- **Purpose**: Provides navigation state debugging and route tracking
- **Configuration**: Connected to the app's navigation reference
- **Use Case**: Debug navigation flows, track route changes, and troubleshoot navigation issues

### 3. Performance Monitor

- **Plugin**: `@rozenite/performance-monitor-plugin`
- **Purpose**: Tracks app performance metrics and rendering performance
- **Configuration**: Basic performance monitoring enabled
- **Use Case**: Monitor app performance, identify bottlenecks, and optimize rendering

## Usage

1. **Start the development server with DevTools enabled**:

   ```bash
   pnpm start
   ```

2. **Open React Native DevTools** with your emulator or device

3. **Access the panels** - they will automatically appear in the DevTools interface

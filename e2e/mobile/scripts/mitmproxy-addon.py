"""
mitmproxy addon that logs all HTTP(S) requests to a file.
Used during iOS E2E tests to capture network traffic.

Usage: mitmdump -s mitmproxy-addon.py --set logfile=path/to/output.log
"""

import datetime
import json
import os

from mitmproxy import ctx, http


class RequestLogger:
    def __init__(self):
        self.logfile = None
        self.entries = []

    def load(self, loader):
        loader.add_option(
            name="logfile",
            typespec=str,
            default="",
            help="Path to the request log file",
        )

    def configure(self, updated):
        if "logfile" in updated and ctx.options.logfile:
            self.logfile = ctx.options.logfile
            os.makedirs(os.path.dirname(self.logfile) or ".", exist_ok=True)

    def response(self, flow: http.HTTPFlow):
        entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "method": flow.request.method,
            "url": flow.request.pretty_url,
            "status_code": flow.response.status_code if flow.response else None,
            "request_size": len(flow.request.content) if flow.request.content else 0,
            "response_size": len(flow.response.content) if flow.response and flow.response.content else 0,
            "duration_ms": round((flow.response.timestamp_end - flow.request.timestamp_start) * 1000, 2) if flow.response else None,
            "request_headers": dict(flow.request.headers),
            "response_content_type": flow.response.headers.get("content-type", "") if flow.response else "",
        }

        self.entries.append(entry)

        # Append to log file
        if self.logfile:
            try:
                with open(self.logfile, "a") as f:
                    f.write(json.dumps(entry) + "\n")
            except Exception as e:
                ctx.log.warn(f"Failed to write to log file: {e}")

        ctx.log.info(
            f"[{entry['method']}] {entry['status_code']} {entry['url']} "
            f"({entry['duration_ms']}ms, {entry['response_size']}B)"
        )

    def error(self, flow: http.HTTPFlow):
        entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "method": flow.request.method,
            "url": flow.request.pretty_url,
            "error": str(flow.error) if flow.error else "unknown error",
            "request_headers": dict(flow.request.headers),
        }

        self.entries.append(entry)

        if self.logfile:
            try:
                with open(self.logfile, "a") as f:
                    f.write(json.dumps(entry) + "\n")
            except Exception as e:
                ctx.log.warn(f"Failed to write to log file: {e}")

        ctx.log.warn(f"[ERROR] {entry['method']} {entry['url']}: {entry.get('error')}")


addons = [RequestLogger()]

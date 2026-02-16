from mitmproxy import http

class PassthroughWebSocket:
    def requestheaders(self, flow: http.HTTPFlow):
        if flow.request.headers.get("upgrade", "").lower() == "websocket":
            flow.stream = True  # Don't buffer, stream directly

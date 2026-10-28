"""
Tests for firebase_capture.py. Run with the mise-pinned mitmproxy and pytest:

    python -m pytest .mise/tasks/mitmproxy/firebase_capture_test.py
"""

import asyncio
import gzip
import json
import os
import sys

from mitmproxy import flow as mitmproxy_flow
from mitmproxy import http
from mitmproxy.test import taddons, tflow

sys.path.insert(0, os.path.dirname(__file__))
from firebase_capture import FirebaseCapture  # noqa: E402

FETCH_URL = "https://firebaseremoteconfig.googleapis.com/v1/projects/ledger-live-testing/namespaces/firebase:fetch?key=k"
TEMPLATE = {"entries": {"feature_x": '{"enabled":true}'}, "state": "UPDATE", "templateVersion": "42"}


def fetch_flow(language="en-US", app_id="1:677185650562:web:abc", headers=None, compress=False, signals=None):
    body = json.dumps(
        {
            "sdk_version": "12.19.0",
            "app_instance_id": "instance",
            "app_instance_id_token": "secret-token",
            "app_id": app_id,
            "language_code": language,
            **({"custom_signals": signals} if signals else {}),
        }
    ).encode()
    request = http.Request.make(
        "POST",
        FETCH_URL,
        b"",
        {"content-type": "application/json", "content-encoding": "gzip", "If-None-Match": "*", **(headers or {})},
    )
    # Like the real SDK: labelled gzip, sent as plain JSON unless compress=True.
    request.raw_content = gzip.compress(body) if compress else body
    return tflow.tflow(req=request)


def answer(flow, status=200, body=None):
    content = json.dumps(TEMPLATE if body is None else body)
    flow.response = http.Response.make(
        status,
        content,
        {"content-type": "application/json", "etag": "etag-42", "access-control-allow-origin": "https://upstream.example"},
    )


def run(test):
    async def with_context():
        addon = FirebaseCapture()
        with taddons.context(addon) as tctx:
            tctx.configure(addon, firebase_capture_wait=1)
            await test(addon, tctx)

    asyncio.run(with_context())


def test_other_requests_pass_through():
    async def test(addon, _):
        flow = tflow.tflow(req=http.Request.make("GET", "https://explorers.api.live.ledger.com/blockchain/v4"))
        await addon.request(flow)
        assert flow.response is None
        assert addon.stats == {}

    run(test)


def test_first_fetch_goes_upstream_and_later_fetches_are_replayed():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        assert leader.response is None
        assert "If-None-Match" not in leader.request.headers
        answer(leader)
        addon.response(leader)

        later = fetch_flow()
        await addon.request(later)
        assert later.response.status_code == 200
        assert json.loads(later.response.get_text()) == TEMPLATE
        assert later.response.headers["etag"] == "etag-42"
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.replayed, stats.failed) == (1, 1, 0)

    run(test)


def test_fetches_wait_for_the_one_in_flight():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        waiters = [fetch_flow(), fetch_flow()]
        tasks = [asyncio.create_task(addon.request(flow)) for flow in waiters]
        await asyncio.sleep(0.05)
        assert all(flow.response is None for flow in waiters)

        answer(leader)
        addon.response(leader)
        await asyncio.gather(*tasks)
        assert [flow.response.status_code for flow in waiters] == [200, 200]
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.replayed) == (1, 2)

    run(test)


def test_failed_fetch_is_not_stored_and_one_waiter_takes_over():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        waiters = [fetch_flow(), fetch_flow()]
        tasks = [asyncio.create_task(addon.request(flow)) for flow in waiters]
        await asyncio.sleep(0.05)

        answer(leader, status=429, body={"error": {"code": 429}})
        addon.response(leader)
        await asyncio.sleep(0.05)
        new_leaders = [flow for flow in waiters if "firebase_capture_future" in flow.metadata]
        assert len(new_leaders) == 1
        assert not addon.cache

        answer(new_leaders[0])
        addon.response(new_leaders[0])
        await asyncio.gather(*tasks)
        (other,) = [flow for flow in waiters if flow is not new_leaders[0]]
        assert other.response.status_code == 200
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.replayed, stats.failed) == (2, 1, 1)

    run(test)


def test_connection_error_releases_waiters():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        waiter = fetch_flow()
        task = asyncio.create_task(addon.request(waiter))
        await asyncio.sleep(0.05)

        leader.error = mitmproxy_flow.Error("connection reset")
        addon.error(leader)
        await task
        assert "firebase_capture_future" in waiter.metadata
        assert next(iter(addon.stats.values())).failed == 1

    run(test)


def test_waiter_goes_upstream_after_the_wait_and_its_answer_is_stored():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        late = fetch_flow()
        await addon.request(late)
        assert late.response is None
        assert "firebase_capture_future" not in late.metadata

        answer(late)
        addon.response(late)
        assert addon.cache
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.timed_out) == (2, 1)

    run(test)


def test_wait_budget_is_not_reset_when_a_leader_is_replaced():
    async def test(addon, _):
        loop = asyncio.get_running_loop()
        started = loop.time()
        leader = fetch_flow()
        await addon.request(leader)
        waiters = [fetch_flow(), fetch_flow()]
        tasks = {asyncio.create_task(addon.request(flow)): flow for flow in waiters}
        await asyncio.sleep(0.6)

        answer(leader, status=429, body={"error": {"code": 429}})
        addon.response(leader)
        await asyncio.sleep(0.05)
        (still_waiting,) = [flow for flow in waiters if "firebase_capture_future" not in flow.metadata]
        (task,) = [task for task, flow in tasks.items() if flow is still_waiting]
        await asyncio.wait_for(task, 2)
        assert loop.time() - started < 1.3
        assert still_waiting.response is None
        assert still_waiting.metadata["firebase_capture_key"]
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.timed_out) == (3, 1)

    run(test)


def test_answer_from_a_fetch_that_stopped_waiting_releases_the_others():
    async def test(addon, _):
        loop = asyncio.get_running_loop()
        leader = fetch_flow()
        await addon.request(leader)
        stopped_waiting = fetch_flow()
        await addon.request(stopped_waiting)
        waiter = fetch_flow()
        task = asyncio.create_task(addon.request(waiter))
        await asyncio.sleep(0.05)

        released_at = loop.time()
        answer(stopped_waiting)
        addon.response(stopped_waiting)
        await asyncio.wait_for(task, 0.5)
        assert loop.time() - released_at < 0.2
        assert waiter.response.status_code == 200

        answer(leader)
        addon.response(leader)
        assert not addon.inflight

    run(test)


def test_empty_or_unchanged_templates_are_not_stored():
    async def test(addon, _):
        for body in ({"state": "NO_TEMPLATE"}, {"state": "UPDATE", "entries": {}}, {"state": "NO_CHANGE"}):
            leader = fetch_flow()
            await addon.request(leader)
            answer(leader, body=body)
            addon.response(leader)
            assert not addon.cache

    run(test)


def test_body_labelled_gzip_is_read_whether_or_not_it_is_compressed():
    async def test(addon, _):
        for flow in (fetch_flow(), fetch_flow(language="fr-FR", compress=True)):
            await addon.request(flow)
            assert "firebase_capture_future" in flow.metadata
        assert len(addon.stats) == 2

    run(test)


def test_each_language_and_app_has_its_own_entry():
    async def test(addon, _):
        for flow in (fetch_flow(), fetch_flow(language="fr-FR"), fetch_flow(app_id="1:890454232477:web:swap")):
            await addon.request(flow)
            assert flow.response is None
            answer(flow)
            addon.response(flow)
        assert len(addon.cache) == 3

    run(test)


def test_custom_signals_are_keyed_by_hash_only():
    async def test(addon, _):
        for flow in (fetch_flow(signals={"user_tier": "gold-123"}), fetch_flow(signals={"user_tier": "silver-456"})):
            await addon.request(flow)
            assert "firebase_capture_future" in flow.metadata
        keys = list(addon.stats)
        assert len(keys) == 2
        assert not any("gold-123" in key or "silver-456" in key for key in keys)

    run(test)


def test_replay_keeps_firebase_cors_headers_and_each_origin_fetches_its_own():
    async def test(addon, _):
        origin = {"Origin": "https://upstream.example"}
        leader = fetch_flow(headers=origin)
        await addon.request(leader)
        answer(leader)
        addon.response(leader)

        same_origin = fetch_flow(headers=origin)
        await addon.request(same_origin)
        assert same_origin.response.headers["access-control-allow-origin"] == "https://upstream.example"

        other_origin = fetch_flow(headers={"Origin": "https://swap.example"})
        await addon.request(other_origin)
        assert other_origin.response is None
        assert "firebase_capture_future" in other_origin.metadata

    run(test)


def test_fetch_with_a_real_etag_goes_to_firebase_untouched():
    async def test(addon, _):
        leader = fetch_flow()
        await addon.request(leader)
        answer(leader)
        addon.response(leader)

        refetch = fetch_flow(headers={"If-None-Match": "etag-42"})
        await addon.request(refetch)
        assert refetch.response is None
        assert refetch.request.headers["If-None-Match"] == "etag-42"
        assert "firebase_capture_key" not in refetch.metadata

        answer(refetch, body={"state": "NO_CHANGE"})
        addon.response(refetch)
        assert json.loads(addon.cache[next(iter(addon.cache))].body) == TEMPLATE
        (stats,) = addon.stats.values()
        assert (stats.upstream, stats.replayed) == (2, 0)

    run(test)


def test_summary_has_counts_and_no_bodies(tmp_path):
    summary_path = tmp_path / "summary.json"

    async def test(addon, tctx):
        tctx.configure(addon, firebase_capture_summary=str(summary_path))
        leader = fetch_flow()
        await addon.request(leader)
        answer(leader)
        addon.response(leader)
        await addon.request(fetch_flow())
        addon.done()

    run(test)
    text = summary_path.read_text()
    (entry,) = json.loads(text).values()
    assert entry["upstream"] == 1
    assert entry["replayed"] == 1
    assert entry["templateVersion"] == "42"
    assert "secret-token" not in text
    assert "feature_x" not in text

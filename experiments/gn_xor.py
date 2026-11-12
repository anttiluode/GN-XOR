"""GN-XOR: native setpoint-port XOR and ring-generated prediction-error pulses.

Uses GN27 unchanged (four-tick pipeline, 50-sample variance, checkerboard tap data).
There is NO XOR if-statement in the update; boolean flags select stimulus pulses only.
"""
import json
import sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from gn27 import Net, Beats, RELAY, settle


def xor_case(a: bool, b: bool, lag: int = 0, weight: float = -4.5, ticks: int = 40):
    """A/B are native relays; their beat wires converge on native relay C."""
    net = settle(Net([RELAY] * 3, [(0, 2, weight, 0), (1, 2, weight, 0)]))
    beats = Beats(3)
    for t in range(ticks):
        sp = np.zeros(3)
        if a and t < 2:
            sp[0] = -10.0
        if b and lag <= t < lag + 2:
            sp[1] = -10.0
        beats.see(net.step(sp_ext=sp), t)
    return {"A": beats.ev[0], "B": beats.ev[1], "C": beats.ev[2]}


def ring_case(missed=(), extras=(), offset=0, weight=-4.5, laps=22):
    """Eight-native-relay ring replays an event each 32 ticks.

    Node 0: outside/world, ring nodes 1..8: prediction, node 9: error.
    Only the first ring beat is injected; all subsequent predictions come from
    native ring edges. World inputs are externally scheduled (not learned).
    """
    edges = [(1 + k, 1 + (k + 1) % 8, -6.0, 0) for k in range(8)]
    edges += [(0, 9, weight, 0), (1, 9, weight, 0)]
    net = settle(Net([RELAY] * 10, edges))
    detector = Beats(10)
    missed = set(missed)
    extras = set(extras)
    for t in range(laps * 32):
        sp = np.zeros(10)
        if t < 2:
            sp[1] = -10.0  # seed just once
        cycle = t // 32
        shifted = (t - offset) % 32 < 2 and t >= offset
        if shifted and cycle not in missed:
            sp[0] = -10.0
        if any(start <= t < start + 2 for start in extras):
            sp[0] = -10.0
        detector.see(net.step(sp_ext=sp), t)
    return {"world": detector.ev[0], "prediction": detector.ev[1],
            "error": detector.ev[9],
            "ring_nodes": {str(i): detector.ev[i] for i in range(1, 9)}}


def report():
    return {
        "truth_table": {f"{int(a)}{int(b)}": xor_case(a, b)
                        for a, b in [(False, False), (True, False),
                                     (False, True), (True, True)]},
        "lag_1": xor_case(True, True, lag=1),
        "matched": ring_case(),
        "missing_lap_5": ring_case(missed=(5,)),
        "unexpected_at_176": ring_case(extras=(5 * 32 + 16,)),
        "missing_laps_5_10": ring_case(missed=(5, 10)),
    }


if __name__ == "__main__":
    print(json.dumps(report(), indent=2))

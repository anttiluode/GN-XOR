# GN-XOR — the geometric neuron detects its own broken prediction

**An experiment, not a claim of new XOR mathematics or learned intelligence.** This repository tests whether the original 2025 Perception Lab geometric unit, using its already-existing setpoint_mod port, can compare an internally circulating prediction with an external event **without coding a Boolean XOR into the unit**.

### What we actually found (12 November 2026)

The receiver's response is **band-pass, not monotone**: one strong negative coupling pulse moves the setpoint into the firing band; two simultaneous pulses push it past the band and suppress firing. This implements a **synchronous event-presence XOR** in a 3-unit circuit.

The original V26 Round 8 used forced pulses to drive its two source units while leaving the receiver native. Here **all three** units use the original native dynamics. The two source units are excited on setpoint_mod rather than force-overridden.

| A input | B input | receiver C |
| --- | --- | --- |
| 0 | 0 | silent |
| 1 | 0 | beat at tick 8 |
| 0 | 1 | beat at tick 8 |
| 1 | 1 | silent |

Sources beat at tick 4 and receiver responds 4 ticks later. Weight of each input edge: -4.5. Relay Constant Signal: 1.6. Each injected source event is a -10 setpoint-port pulse for 2 ticks.

**Timing matters.** Delaying B just 1 tick while both inputs are present makes the receiver fire; this is a coincidence-sensitive detector, NOT a general content-aware XOR, identity comparator or arbitrary Boolean network gate.

### Ring experiment: replay compared with world

A native 8-relay, 32-tick, one-way ring (edges -6.0) is seeded **once**. Its unit 1 then emits repeated predictions without further input. External/world relay 0 receives events on the same schedule. Both feed receiver 9 on edges of -4.5. All 10 units run the unchanged geometric update.

| Condition | Receiver/error beat ticks (relative to experiment start) |
| --- | --- |
| Matched external 32-tick rhythm | none |
| External world event omitted at lap 5 | 168 |
| Unexpected extra world event at tick 176 | 184 |
| Events omitted at laps 5 and 10 | 168, 328 |

**No learning is implemented**; rhythm and connections are manually chosen, and an external discrete tick still advances the simulator. The result is narrow: a synchronized **event-presence mismatch** produces native error pulses. Distinct symbols, broad timing jitter, adaptive retuning and task-level usefulness remain open.

### Reproduce

Requires Python 3 and NumPy, or Node.js for a zero-dependency JavaScript check.

    pip install -r requirements.txt
    python -m unittest discover -s tests -p "test_*.py" -v
    python experiments/gn_xor.py
    node tests/test_xor.cjs

Open index.html directly from disk for the offline interactive laboratory. The browser uses the same original tap table and GN27 JavaScript simulator. No model download, backend, GPU, build step or external libraries.

### Where the underlying neuron comes from

- [GeometricNeuronOriginReview](https://github.com/anttiluode/GeometricNeuronOriginReview): original Perception Lab ecg.json loop and reduction.
- [GeometricNeuronSurfaceListener](https://github.com/anttiluode/GeometricNeuronSurfaceListener): V26 Round 8 native setpoint_mod and two-source cancellation (12/12 individual; 0/12 simultaneous with source output overrides).
- [GeometricNeuronV27](https://github.com/anttiluode/GeometricNeuronV27): actual 16-splitter lookup table, 4-tick pipeline, 50-sample variance, native relay and pulse ring. Source files gn27.py, v27.js, taps.json, taps.js in this repository were copied unchanged from v27, MIT licensed.

This is structurally reminiscent of non-monotone dendritic integration (e.g., Gidon et al., Science, 2020). Similarity does not prove that this synthetic graph is a model of biological dendritic ionic dynamics. Nor does XOR prove novelty: classic single-layer perceptrons are monotone; non-monotone or multi-layer units can implement XOR.

### How it works

The original update is preserved inside gn27.py/v27.js:

    q(t) = trunc(5 + 50 * o(t - 4))
    R(t) = taps[q][0] + ... + taps[q][3]
    S(t) = 0.5 + 0.1 * (constant + weighted beat wires + external setpoint pulse)
    variance = var(last 50 R values)
    output = native damp or amplify branch around S, based on variance > 0.1

The **experiment** chooses which source to stimulate, and the ring's wiring, but it never supplies an error value or explicitly compares A to B. The receiving unit generates its own beat (or not).

### What would count as progress?

1. Test sensitivity to edge strength, noise and phase drift. One-tick changes already alter the truth table.
2. Distinguish symbol identity, not just whether two events coincide.
3. Let the error beat alter a *native slow state* and measure whether future inputs take different accessible routes.
4. Compare against equally small classical event detectors; do not confuse a working demo with superior performance.

**Provenance note:** The historical 12/12 V26 tests and this repository's new native-source tests are different experimental protocols. Do not combine their counts.

"""Regression tests: observed beats, not XOR assembled by conditionals."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "experiments"))
from gn_xor import xor_case, ring_case


class NativeXorTests(unittest.TestCase):
    def test_synchronous_truth_table(self):
        expected = {(0, 0): [], (1, 0): [8], (0, 1): [8], (1, 1): []}
        for (a, b), result in expected.items():
            with self.subTest(a=a, b=b):
                got = xor_case(bool(a), bool(b))
                self.assertEqual(got["C"], result)

    def test_sources_are_native(self):
        self.assertEqual(xor_case(True, True)["A"], [4])
        self.assertEqual(xor_case(True, True)["B"], [4])

    def test_one_tick_shift_breaks_cancellation(self):
        self.assertNotEqual(xor_case(True, True, lag=1)["C"], [])

    def test_ring_matches(self):
        d = ring_case()
        self.assertEqual(d["error"], [])
        self.assertEqual(d["prediction"][:4], [4, 36, 68, 100])
        self.assertEqual(d["world"][:4], [4, 36, 68, 100])

    def test_missing_event(self):
        self.assertEqual(ring_case(missed=(5,))["error"], [168])

    def test_extra_event(self):
        self.assertEqual(ring_case(extras=(176,))["error"], [184])

    def test_two_misses(self):
        self.assertEqual(ring_case(missed=(5, 10))["error"], [168, 328])


if __name__ == "__main__":
    unittest.main()

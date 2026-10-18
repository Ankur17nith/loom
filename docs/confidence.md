# Confidence and verification

Confidence describes how strongly Loom established a static relationship. It
is not a probability of failure.

| Confidence | Meaning |
| --- | --- |
| `high` | The contract and property access are connected through an explicit local type/import relationship. |
| `medium` | A reachable consumer and matching property are found, but the type relationship is not fully resolved. |
| `low` | The result relies on a weak heuristic and needs developer review. |

The current core slice does not execute repository tests automatically. A
successful type parse is not runtime proof, and a clean report is not proof
that unrelated regressions do not exist. The dashboard therefore labels
verification as report data and never turns static confidence into a green
runtime status.

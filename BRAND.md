# Knurl

Masterbrand documentation for the Knurl athletic institution and Knurl OS.

## Origin thesis

Knurling is a diamond pattern cut into a barbell so a hand can hold a load that would otherwise slip. It is not decoration. It is friction, specified and machined into steel.

Knurl applies that ethic to four surfaces: software, iron, rooms, and coaching. The institution is built to last in the same way a bar is built to last — measured, local, and indifferent to fashion.

The name is a shop term, not a startup coinage. It already lives on every serious barbell. We took it as the house mark.

## Brand taxonomy

| Layer | Name | Role |
|---|---|---|
| Masterbrand | **Knurl** | Institution. Appears on iron, halls, apparel, and documents. |
| Software | **Knurl OS** | Local-first training log, plate math, and biomechanics ledger. This application. |
| Hardware | **Knurl Iron** | Calibrated plates, Olympic and specialty bars, collars, racks. |
| Facilities | **Knurl Halls** | Purpose-built strength rooms. Monolithic, high-contrast, no lounge program. |
| Education | **Knurl Academy** | Coaching framework. Positions, recorded load, mechanical cues. |

Sub-brands never replace the masterbrand. Speak “Knurl OS by Knurl”, “Knurl Iron”, “a Knurl Hall”. Do not invent a fifth layer.

## Mark

**Geometry** (viewBox `0 0 32 32`):

- Field: square, mill-scale `#0E0E0C`.
- Outer diamond: `M16 3 L29 16 L16 29 L3 16 Z` in chalk `#E8E2D4`.
- Inner diamond: `M16 10 L22 16 L16 22 L10 16 Z` in mill-scale.

The mark is a single knurl cell — the negative space of a diamond cut. It must remain a diamond ring, never a filled lozenge, never a letterform.

**Clear space:** one outer-diamond width on every side.

**Minimum sizes:** 16×16 px digital; 8 mm laser-etched on an end-cap; 200 mm on a hall facade.

**Variants** (in-app, `appIcon` pref):

| Key | Field | Glyph |
|---|---|---|
| `mark` | Mill | Chalk diamond, mill window |
| `solid` | Chalk | Mill diamond, chalk window |
| `oxide` | Oxide | Chalk diamond, oxide window |

Do not add a drop shadow, gradient, or outer glow. Do not place type inside the mark. The wordmark sits beside it, never inside it.

**Laser etch:** 0.2 mm line, no paint fill, on bare steel. Reverse (chalk field, mill glyph) on powder-coated plates. Facade: the diamond cut as a recess in dark concrete or mill-scale cladding, edge-lit from above.

**Wordmark:** `KNURL` in Big Shoulders Display, weight 800, tracking +140 to +180. Product line `OS` in Archivo, 10–11 px, tracking +360, steel.

## Colour

Engineered for chalk-dusted glass and harsh overhead lighting. No glare whites. No gym-bro neon.

| Token | Hex | Role |
|---|---|---|
| Mill | `#0E0E0C` | Field. App background, iron powder, hall wall. |
| Graphite | `#161613` | Elevated surface. |
| Elevated | `#1F1F1A` | Controls, chips. |
| Inset | `#0A0A09` | Inputs. |
| Chalk | `#E8E2D4` | Type and primary fill. Warm off-white, not `#FFFFFF`. |
| Steel | `#9A9588` | Secondary type. |
| Oxide | `#C45C32` | Live state only: open session, complete-set, rest clock. Not brand wallpaper. |
| Oxide dim | `#8A3D22` | Destructive. |
| Hairline | `#2C2B28` | Borders on mill. |
| Verdigris | `#6E8B74` | Sparse success, never large fills. |

**Chalk theme** (optional bright-hall invert): field `#E8E2D4`, type `#141411`, oxide held.

Accent budget: chalk-on-mill for primary actions; oxide only when a session is live or a load is unresolved.

## Type

- **Display:** Big Shoulders Display 800. Section ticks (`FLOOR`, `LEDGER`, `OUTPUT`) and the wordmark.
- **UI:** Archivo Variable, width ~96. Body 400, labels 500, actions 500–600.
- **Numerals:** tabular lining figures on every live number (load, rest, streak, charts).

Two families. No third. No Inter, no geometric-startup grotesks.

Scale: 11px / 14px / 16px UI; display 3xl–6xl for view titles. Labels are 10–11px uppercase with wide tracking. Do not set long sentences in uppercase.

## Voice

Direct, measured, practical. Athletic and mechanical vocabulary. No cheerleading.

Say: *Close the set. Rest 150s. Inventory cannot hit 102.5 kg. Nearest 100 kg.*

Do not say: *Crush it. Beast mode. You’ve got this. Unlock your potential. Synergy.*

Errors are *faults*. Storage is the *vault*. The home view is *Command*. A workout in progress is *live*, not *in progress on your fitness journey*.

## Motion

150–250 ms, ease-out. Opacity and transform only. Respect `prefers-reduced-motion`. No bounce. No confetti.

## Physical standards (Iron & Halls)

- Plates: ±10 g of marked denomination after coat.
- Bars: 20.00 kg / 15.00 kg specified. End-cap bears the knurl cell.
- Collars: 1.25 kg each unless the hall posts spring clips.
- Halls: even overhead light, high-contrast wall copy, posted plate map, 2.5 kg increments without asking.
- Apparel: mill field, chalk print, oxide only as a small cell on the left chest or bar-end.

## Software promises (OS)

Local-first is a brand promise, not a technical footnote. No accounts. No subscriptions. No remote telemetry. The vault is IndexedDB on the device, exportable as versioned JSON.

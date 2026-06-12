# Lactate Studio — Market Research Brief

*Prepared June 2026. A desktop application (Tauri + React) that turns incremental step-test data into detected lactate thresholds, FTP / threshold-pace estimates, a labelled lactate-vs-intensity curve, and training zones — for endurance athletes and coaches across cycling, running, and rowing.*

> **Note on sourcing.** Every nontrivial market claim below carries an inline source URL. Pricing is quoted only where a vendor or reseller publishes it; where it is not public, this brief says **"pricing not public"** rather than inventing a figure. All market-size numbers are explicitly labelled **estimates** with stated assumptions and arithmetic. Several inputs (coach counts, lactate-testing adoption) have no authoritative public figure and are flagged as such.

---

## 1. Executive Summary

**Positioning angle.** Lactate Studio is the *transparent, offline-first, affordable* desktop workbench for lactate step-testing. The incumbent that "owns" metabolic profiling from lactate data, INSCYD, is a closed-box, consultation-gated, subscription product whose pricing is deliberately hidden ([Coachbox INSCYD pricing review](https://coachbox.app/en/compare/inscyd-pricing/)); the affordable end of the market is a 20-year-old Excel macro (Lactate-E) and free open-source tools ([Uiginn / Lactate-E](http://www.uiginn.com/lactate/lactate-e2.html)). Lactate Studio sits in the gap: a modern native app that shows its work — letting the user pick and compare threshold-detection methods (Dmax, Modified Dmax, fixed OBLA 4 mmol/L, log-log, segmented regression) on an editable, spreadsheet-style grid, with results that never leave the machine.

**Key takeaways**

- **The category leader hides its price and gates access behind certification.** INSCYD has no public pricing page and requires consultation/certification before a coach learns the cost ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)). That is a positioning gift for a transparent, self-serve tool.
- **The affordable alternatives are dated or generic.** The most-cited cheap option, Lactate-E 2.0, is a shareware Microsoft Excel 2003 macro ([Uiginn](http://www.uiginn.com/lactate/lactate-e2.html)). Most self-coached athletes fall back to hand-built spreadsheets.
- **Threshold detection is genuinely contested science — transparency is a feature, not a gimmick.** Different methods disagree materially: in elite cyclists, Modified-Dmax and OBLA-4 mmol/L overestimated maximal lactate steady state by ~32 W and ~43 W respectively, while plain Dmax tracked it within ~2 W ([BMC Sports Sci Med Rehabil 2020](https://link.springer.com/article/10.1186/s13102-020-00219-3)). Letting users see and choose methods is defensible and differentiating.
- **The hardware installed base is real and growing.** Portable analyzers (Lactate Plus ~$325, Lactate Scout ~$375) put lactate testing within reach of clubs and serious amateurs ([lactate.com pricing](https://lactate.com/pricing.html)), and every meter sold is a potential Lactate Studio user who needs software to interpret the numbers.
- **The endurance base is large.** ~621 million runners globally ([Marathon Handbook](https://marathonhandbook.com/how-many-people-have-run-a-marathon/)) and ~5.8 million triathletes ([WiFiTalents](https://wifitalents.com/triathlon-participation-statistics/)); the serviceable slice that owns a meter and tests methodically is small but high-intent.
- **Pricing white space exists between "free" and "call us."** A one-time license or low-cost subscription in the tens-of-dollars range — anchored by WKO5's $169 one-time price ([TrainingPeaks WKO5](https://www.trainingpeaks.com/wko5/)) — is unoccupied for a lactate-specialist tool.

---

## 2. Problem & Buyer Segments

Lactate testing produces a small table — intensity (watts or pace), blood lactate (mmol/L), heart rate, per stage — that must be turned into thresholds, zones, and a curve. The math is fiddly, method-dependent, and easy to get wrong. Today, four buyer types solve this in four unsatisfying ways.

### 2.1 Endurance coaches (cycling / running / triathlon)

- **Workflow today:** A coach runs a step test on an athlete with a portable analyzer, then either (a) types numbers into a personal Excel template, (b) pays per-test into a cloud tool like INSCYD, or (c) eyeballs a fixed 4 mmol/L line.
- **Pain:** Spreadsheets are unauditable and break; cloud per-test fees add up; fixed-threshold shortcuts are known to misestimate the real steady state for many athletes ([BMC 2020](https://link.springer.com/article/10.1186/s13102-020-00219-3)). Coaches also want to *explain* a number to an athlete, which a black box undermines.
- **Reachability:** Concentrated in coaching-education bodies and platforms — USA Triathlon alone connects with 400,000+ members and sanctions 4,000+ races a year ([USA Triathlon](https://www.usatriathlon.org/our-community/coaches)).

### 2.2 Sports-science labs & university programs

- **Workflow today:** Lab-grade metabolic carts (COSMED, Cortex) with bundled analysis software, often paired with a benchtop lactate analyzer (e.g., EKF Biosen) ([EKF Biosen Sports](https://www.ekfdiagnostics.com/biosen-sports.html)).
- **Pain:** Cart software is expensive, locked to the hardware vendor, and not built for quick multi-method threshold comparison or teaching. Researchers frequently drop to custom R/Excel to compute Dmax/log-log markers — exactly the niche Lactate-E and its R successor Lactate-OR were built to fill ([Orreco / Lactate-OR](https://orreco.io/lactate/)).
- **Reachability:** Small in number but influential; a credible, citable method implementation earns word-of-mouth and student adoption.

### 2.3 Self-coached athletes (cyclists, runners, triathletes)

- **Workflow today:** A growing cohort buys their own meter (Lactate Plus / Lactate Scout) and self-tests on a trainer or track ([lactate.com](https://www.lactate.com/)). They then search for "how to calculate lactate threshold" and assemble a spreadsheet.
- **Pain:** No affordable, trustworthy, *guided* desktop tool. Free training apps like GoldenCheetah let you *enter* a threshold you found elsewhere but don't detect it from raw lactate steps ([GoldenCheetah Wiki — Training Zones](https://github.com/GoldenCheetah/GoldenCheetah/wiki/UG_Preferences_Athlete_Training-Zones)). INSCYD is out of reach (consultation-gated, ~$149–350 per test through providers) ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)).
- **Reachability:** Cycling/triathlon forums, subreddits, YouTube, and meter-resale channels.

### 2.4 Lactate-analyzer vendors (channel, not end-user)

- **Who:** Nova Biomedical (Lactate Plus), EKF Diagnostics (Lactate Scout / Biosen), and resellers like lactate.com and HaB Direct.
- **Interest:** They sell hardware but largely leave interpretation to the customer. A polished, affordable companion app is a value-add they could bundle or recommend — turning "here's a number" into "here's your training plan."
- **Reachability:** Direct B2B; the bundling/co-marketing play in §6.

---

## 3. Competitor Scan

Prices are listed **only where published**; otherwise "pricing not public." Currencies are as quoted by the source.

| Product | What it does | Platform | Pricing (if public) | Strengths | Weaknesses |
|---|---|---|---|---|---|
| **INSCYD** | Full metabolic profile (VO2max, VLamax, FatMax, lactate curve, zones) from a test | Web (SaaS), practitioner-gated | **Not public** — no pricing page; consultation + certification required. 3rd-party *estimates*: athlete tests ~$149–350; practitioner subs *estimated* €1,000–5,000+/yr ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)) | Deep physiological model; strong brand among elite coaches; rich outputs ([INSCYD](https://inscyd.com/functions/lactate-testing/)) | Opaque pricing; closed methodology; online-only; expensive; gated access |
| **Lactate-E 2.0** (Newell et al.) | Computes blood-lactate endurance markers (multiple methods incl. Dmax, log-log) | MS **Excel** (desktop) | Shareware; suggested donation **€30 individuals / €100 organisations** ([Uiginn](http://www.uiginn.com/lactate/lactate-e2.html)) | Free/cheap; research-validated methods; multi-method | Excel 2003-era; dated UX; no native app; not multi-sport-aware; no live capture |
| **Lactate-OR** (Orreco) | R/Shiny web app implementing lactate-marker algorithms | Web (browser) | **Pricing not public** (positioned as free research tool) ([Orreco](https://orreco.io/lactate/)) | Modern reimplementation of Lactate-E in open-source R; algorithm transparency | Web-only; research-oriented; limited coaching/zone workflow |
| **lactate.com / meter vendor tools** | Sell analyzers (Lactate Plus, Scout, Accutrend) + basic guidance | Hardware + web info | Meters: **Lactate Plus $325**, **Lactate Scout $375**; strips ~$1.88–2.16 each ([lactate.com](https://lactate.com/pricing.html)) | Owns the data-capture moment; trusted by clubs | Little/no analysis software; interpretation left to user |
| **WKO5** (TrainingPeaks) | Advanced training analytics; power/HR modeling; mFTP, zones | **Desktop** (Win/Mac) | **$169 one-time** (14-day trial; 20% WKO4 upgrade) ([TrainingPeaks](https://www.trainingpeaks.com/wko5/)) | Desktop, one-time price, deep analytics, large user base | Not a lactate step-test tool; models from power/HR, not blood lactate; steep learning curve |
| **Today's Plan** | Training + analytics platform | Web + mobile | Analytics *was* **AU$9.95/mo or AU$99.95/yr** ([Cyclingnews](https://www.cyclingnews.com/features/todays-plan-training-and-virtual-coaching-software/)); **reportedly out of business** ([Cycling Coach AI](https://cyclingcoachai.com/todays-plan-alternative/)) | (Historically) strong coach tooling | Apparently defunct; not lactate-focused |
| **GoldenCheetah** | Open-source performance analysis (power, HR, NIRS) | **Desktop** (Win/Mac/Linux) | **Free** (GPL v2) ([GoldenCheetah](https://www.goldencheetah.org/)) | Free, offline, powerful, extensible; can *store* LT/LTHR | You enter thresholds from external tests; doesn't detect LT from raw lactate steps ([Wiki](https://github.com/GoldenCheetah/GoldenCheetah/wiki/UG_Preferences_Athlete_Training-Zones)); cycling-centric; technical UX |
| **Generic spreadsheets** (Excel/Sheets) | Whatever the user builds | Desktop/web | Free–cheap (license cost only) | Ubiquitous, flexible, offline | Error-prone, unauditable, no validated methods, no curve/zone automation |
| **Metabolic-cart software** (COSMED, Cortex) | Lab CPET / gas-exchange analysis; lactate often entered alongside | Desktop, vendor-locked to hardware | **Pricing not public** (capital lab equipment; quote-based) ([COSMED Quark CPET](https://www.cosmed.com/en/products/cardio-pulmonary-exercise-test)) | Gold-standard lab integration; clinical credibility | Very expensive; hardware-locked; overkill for field lactate testing; not built for multi-method LT teaching |

### Notes

- **INSCYD is the strategic reference point, not a feature-parity target.** Its model estimates VLamax/VO2max from one test — more than Lactate Studio claims to do — but its *opacity and price* are the wedge. Lactate Studio competes on transparency, offline ownership, and price, not on replicating its physiological model.
- **Lactate-E / Lactate-OR validate the demand and the methods.** A peer-reviewed lineage ([Newell et al., *J. Sports Sci.* 2007](https://www.tandfonline.com/doi/abs/10.1080/02640410601128922)) already computes the exact markers Lactate Studio targets — proof the methods matter, and a UX/native-app gap to exploit.
- **WKO5 is the pricing and platform proof.** A successful **desktop, one-time-$169** endurance tool shows athletes will buy native software outright ([TrainingPeaks](https://www.trainingpeaks.com/wko5/)) — but it works from power/HR, leaving the blood-lactate niche open.
- **GoldenCheetah is the "free, offline, but not lactate-native" anchor.** It proves desktop + offline + open is viable and loved, while leaving raw-lactate threshold *detection* unserved.

---

## 4. Market Sizing (TAM / SAM / SOM — all figures ESTIMATES)

> **Heavy caveat.** There is no authoritative public count of "people who do lactate step tests" or "certified endurance coaches" worldwide. The figures below are **order-of-magnitude estimates** built from participation data and explicit, stated assumptions. Treat them as a sizing *frame*, not a forecast. Every assumption is labelled so it can be challenged or replaced.

### 4.1 Inputs (sourced)

| Input | Figure | Source |
|---|---|---|
| Global runners | ~621 million | [Marathon Handbook](https://marathonhandbook.com/how-many-people-have-run-a-marathon/) |
| Global triathletes (2023) | ~5.8 million | [WiFiTalents](https://wifitalents.com/triathlon-participation-statistics/) |
| US triathletes (2023) | ~1.6 million | [WiFiTalents](https://wifitalents.com/triathlon-participation-statistics/) |
| US runners/joggers | ~49–50 million | [Statista via search](https://www.statista.com/topics/1743/running-and-jogging/) |
| Regular cyclists (England, illustrative) | ~7 million (16% of 16+) | [Statista via search](https://www.statista.com/topics/1686/cycling/) |
| USA Triathlon reach | 400,000+ members; 4,000+ races/yr | [USA Triathlon](https://www.usatriathlon.org/our-community/coaches) |
| Portable analyzer entry price | Lactate Plus $325 / Scout $375 | [lactate.com](https://lactate.com/pricing.html) |

### 4.2 TAM — Total Addressable Market (estimate)

*Definition: all endurance athletes and coaches worldwide who could plausibly interpret a lactate step test in software.*

- Endurance-athlete population (assume runners dominate, de-duplicate triathletes/cyclists into a single "serious endurance athlete" pool): take a conservative **~50 million** "structured-training" endurance athletes globally (a small fraction of the 621M who run at all, since most runners are casual). *Assumption: ~8% of all runners train structurally enough to ever consider testing.*
- Add coaches: if ~1 coach per ~100 structured athletes → **~500,000 coaches** globally. *Assumption-based.*
- **TAM ≈ 50.5 million people.** If each *could* spend ~$50 on software once: **TAM ≈ $2.5 billion** (one-time-equivalent). *Estimate; highly assumption-sensitive.*
  - Arithmetic: 50,500,000 × $50 ≈ $2.53B.

### 4.3 SAM — Serviceable Addressable Market (estimate)

*Definition: endurance athletes/coaches who actually do (or would do) blood-lactate testing — i.e., own or have access to a lactate analyzer — and use English-language desktop software.*

- Lactate testing is a **minority practice** even among structured athletes (it requires buying a $300+ meter and finger-prick sampling). *Assumption: ~3% of the 50M structured athletes either own a meter or test via a coach/lab.* → **~1.5 million** athletes.
- Add the coach/lab layer that runs tests for others (already implicitly serving athletes; count coaches as buyers): **~150,000** testing-capable coaches/labs. *Assumption: ~30% of the 500k coaches do any lactate testing.*
- **SAM ≈ 1.65 million potential buyers.**
- At a blended **$40** realized price per buyer (mix of one-time licenses and ~1-year subs): **SAM ≈ $66 million.**
  - Arithmetic: 1,650,000 × $40 ≈ $66M. *Estimate.*

### 4.4 SOM — Serviceable Obtainable Market (estimate, years 1–3)

*Definition: the realistic capturable slice for an indie/small-team desktop product with modest marketing.*

- New entrants in a niche prosumer category typically capture a **low-single-digit %** of SAM within 3 years. *Assumption: 1–3% penetration.*
- At **1% of 1.65M buyers = 16,500 customers**; at **3% = ~49,500 customers**.
- Revenue range at $40 blended: **~$0.66M (1%) to ~$2.0M (3%)** cumulative over 3 years.
  - Arithmetic: 16,500 × $40 ≈ $0.66M; 49,500 × $40 ≈ $1.98M. *Estimate.*
- **Sensitivity:** SOM swings hugely on (a) the lactate-testing adoption rate (the 3% SAM assumption) and (b) price point. If true testing adoption is half of assumed, halve every figure. **These are planning brackets, not promises.**

### 4.5 Sizing summary (estimates)

| Tier | People (est.) | $ (est., one-time-equiv.) | Core assumption to challenge |
|---|---|---|---|
| **TAM** | ~50.5M | ~$2.5B | 8% of runners train structurally; $50 each |
| **SAM** | ~1.65M | ~$66M | ~3% of structured athletes do lactate testing |
| **SOM (Y1–3)** | ~16.5k–49.5k | ~$0.66M–$2.0M | 1–3% capture; $40 blended price |

---

## 5. Pricing Strategy Options

Real comparables, from this brief's research:

| Model | Real comparable | Price point (published) |
|---|---|---|
| **One-time license** | WKO5 (desktop endurance analytics) | **$169 one-time** ([TrainingPeaks](https://www.trainingpeaks.com/wko5/)) |
| **Shareware / donation** | Lactate-E 2.0 | **€30 individual / €100 org** suggested ([Uiginn](http://www.uiginn.com/lactate/lactate-e2.html)) |
| **Low subscription** | Today's Plan analytics (historical) | **AU$9.95/mo or AU$99.95/yr** ([Cyclingnews](https://www.cyclingnews.com/features/todays-plan-training-and-virtual-coaching-software/)) |
| **Per-test / usage** | Coachbox (lactate per-test) | **€3–6 per test**, 5–20 free/mo ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)) |
| **Free / open-source** | GoldenCheetah | **$0** (GPL v2) ([GoldenCheetah](https://www.goldencheetah.org/)) |
| **Quote-gated enterprise** | INSCYD | **Not public**; consultation-gated ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)) |

**Recommended options to test**

1. **One-time desktop license (primary).** Lactate Studio's offline-first, native nature fits an outright purchase. Anchor *below* WKO5 — e.g., a one-time price in the **~$49–99** range (well under WKO5's $169) reads as "serious tool, fair price." This is the cleanest contrast to INSCYD's opacity and rentals. *(Price point is a recommendation to validate, not a sourced figure.)*
2. **Freemium → paid unlock.** Free tier: enter data, see the curve, one method (e.g., fixed OBLA). Paid: all detection methods (Dmax/ModDmax/log-log/segmented), multi-sport, export, future live capture. Mirrors how the market already separates "free entry-level" (GoldenCheetah) from "pay for the method depth" (INSCYD/Lactate-E).
3. **Coach/lab tier.** A higher one-time or low annual price for multi-athlete management — competing with per-test SaaS economics by being *flat and offline*. Pitch: "stop paying €3–6 per test ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)) — own the tool."

**Pricing principle:** lead with *transparency* (publish the price prominently) — itself a differentiator against INSCYD ([Coachbox](https://coachbox.app/en/compare/inscyd-pricing/)).

---

## 6. Positioning & Go-to-Market

**Positioning statement.** *Lactate Studio is the transparent, offline-first desktop app that turns a lactate step test into trustworthy thresholds, zones, and curves — across cycling, running, and rowing — at a price you can see, with the math you can inspect.*

Four pillars, each mapped to a competitor weakness:

| Pillar | Against whom | The contrast |
|---|---|---|
| **Offline-first native** | INSCYD (web), Lactate-OR (web), cart software (locked) | Data never leaves the machine; works trackside without internet |
| **Affordable & transparent price** | INSCYD (hidden, expensive) | Published, fair, one-time-friendly |
| **Transparent multi-method detection** | INSCYD (black box), spreadsheets (ad hoc) | Pick Dmax / ModDmax / OBLA-4 / log-log / segmented; *see* why they differ — defensible given methods genuinely disagree ([BMC 2020](https://link.springer.com/article/10.1186/s13102-020-00219-3)) |
| **Multi-sport** | GoldenCheetah/WKO5 (cycling-leaning) | Cycling watts, running pace, rowing — one tool |

**Channels**

1. **Lactate-meter bundling / co-marketing.** Partner with Nova Biomedical, EKF, and resellers (lactate.com, HaB Direct) to bundle or recommend Lactate Studio with every analyzer — the natural "now interpret it" companion to a $325–375 meter ([lactate.com](https://lactate.com/pricing.html)). Highest-intent channel: the buyer already owns the data source.
2. **Coaching-education bodies.** USA Triathlon (400,000+ members, formal coach certification tiers) ([USA Triathlon](https://www.usatriathlon.org/our-community/coaches)), plus USA Cycling and USATF coaching tracks. Offer education content and coach discounts.
3. **Cycling/triathlon communities & creators.** Forums, subreddits, and YouTube physiology channels — where self-coached athletes already ask "how do I calculate my lactate threshold." A free tier (§5) is the on-ramp.
4. **Federations & university labs.** A citable, validated method implementation (echoing the Lactate-E peer-reviewed lineage ([Newell et al. 2007](https://www.tandfonline.com/doi/abs/10.1080/02640410601128922))) earns lab credibility and student adoption, seeding the next generation of coaches.

---

## 7. Risks & Open Questions

**Risks**

- **Adoption-rate uncertainty dominates the model.** The entire SAM/SOM rests on an *assumed* lactate-testing adoption rate (~3% of structured athletes) with **no authoritative source**. If real adoption is materially lower, the obtainable market shrinks proportionally. This is the single biggest unknown.
- **Lactate testing may be a shrinking niche.** Wearables and smartwatches increasingly *estimate* lactate-threshold HR/pace without a finger-prick ([smartwatch LT validity study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12309276/)). If "good-enough" estimates satisfy most athletes, blood-lactate testing could stay specialist or decline.
- **"Transparent multi-method" cuts both ways.** Showing five methods that disagree by tens of watts ([BMC 2020](https://link.springer.com/article/10.1186/s13102-020-00219-3)) can confuse non-expert users. The UX must *guide* (sensible defaults, plain-language explanation) or risk feeling like a confusing science toy versus INSCYD's confident single answer.
- **Free/open-source substitution.** GoldenCheetah (free) ([GoldenCheetah](https://www.goldencheetah.org/)) and the donation-ware Lactate-E ([Uiginn](http://www.uiginn.com/lactate/lactate-e2.html)) cap willingness-to-pay at the low end. A free tier may be necessary, compressing margins.
- **Incumbent response.** INSCYD or a meter vendor could add a cheap, transparent mode and neutralize the wedge. The defensibility is execution speed, native UX, and offline ownership — not a patent.
- **Channel dependency.** Meter-vendor bundling is the best channel but concentrates risk in a few B2B relationships that may not materialize.

**Open questions (to resolve before/at launch)**

1. **What is the real, defensible number of lactate-testing athletes and coaches?** No public figure exists — worth a primary survey or a meter-vendor data partnership to replace the §4 assumptions.
2. **How many lactate analyzers are sold per year, and through whom?** Directly sizes the highest-intent channel. Not found publicly here.
3. **One-time vs subscription:** which does this specific buyer prefer? WKO5 proves one-time works ([TrainingPeaks](https://www.trainingpeaks.com/wko5/)); test against a low sub.
4. **Will coaches pay flat-and-offline to escape per-test SaaS fees** (€3–6/test, [Coachbox](https://coachbox.app/en/compare/inscyd-pricing/))? Validate the §5 coach-tier thesis.
5. **Regulatory/liability:** does presenting training zones from blood data carry any health-claim exposure in target markets? Out of scope here; flag for legal review.
6. **Rowing demand depth.** Cited as a differentiator but unquantified in this research — confirm there's a real rowing user base versus cycling/running.

---

*All pricing reflects what vendors/resellers published as of the cited dates (several "effective Jan 2026"); verify before quoting externally. Market-size figures are estimates derived from the stated assumptions and should be revised as primary data becomes available.*

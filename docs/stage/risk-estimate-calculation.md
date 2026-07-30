# Aeris risk estimate — PLCOm2012noRace calculation

## Purpose

After a screening draft is completed, Aeris shows a **Risk support** screen with a **6-year lung-cancer probability** from the Tammemägi **PLCOm2012noRace** model.

This document explains how that percentage is produced in code (`src/plcom2012-norace.ts`, `src/risk-estimate.ts`).

## What this is (and is not)

| This estimate **is** | This estimate **is not** |
|---|---|
| The published **PLCOm2012noRace** 6-year probability | A custom Aeris point-score burden index |
| Based on screening fields that map 1:1 to model predictors | A mix of PLCO + environmental PM2.5 + LCP registry |
| Appropriate for non-US / Asian populations (no race variable) | A diagnosis or automatic screening authorization |
| Validated for **current and former smokers** | Applicable to never-smokers |

Reference: Pasquinelli et al., *Journal of Thoracic Oncology* (2020) on PLCOm2012noRace; calculator coefficients from Tammemägi PLCOm2012noRace Ver1-13OCT2016-MT (non-commercial reference under `references/risk-calculators/`).

Commercial use of the reference calculator requires contacting Professor Martin Tammemägi.

---

## Runtime flow

```
Screening draft completed
        │
        ▼
estimateAerisRisk(screening, environmental?)
        │
        ├─► map screening → PLCOm2012noRace inputs
        ├─► if never-smoker / incomplete → Unavailable
        ├─► else logit → probability → percent
        ├─► list symptoms as clinical flags
        └─► list local Philippine/Asian considerations (not scored)
        │
        ▼
Risk support UI (6-year % + predictors + local considerations)
```

There is no remote risk API. Calculation runs locally in the browser.

**Not included in the percentage:** Open-Meteo air quality, LCP public regional counts, occupational / biomass exposures, prior TB, never-smoker Asian pattern notes, EGFR population context, and symptoms.

---

## Final probability formula

```
xb = Σ (transformed_or_centered_predictor × beta) + intercept
p  = exp(xb) / (1 + exp(xb))
percent = round(p × 1000) / 10
```

### Display bands (triage labels on the absolute probability)

| 6-year percent | Band |
|---|---|
| `< 1.5%` | Lower |
| `1.5% – 3.1%` | Intermediate |
| `≥ 3.2%` | Elevated |

Many programs discuss eligibility around **≥ 1.5%** or **≥ 2.0%**; Aeris does not authorize screening.

---

## Model predictors (exact calculator inputs)

| Predictor | Screening field(s) | Transform / coding |
|---|---|---|
| Age (years) | `age` | centered at 62 |
| Education (1–6) | `educationLevel` | centered at 4 |
| BMI | `heightCm` + `weightKg` → `bmi` | centered at 27 |
| COPD | `copd` Yes/No | 1 / 0 (`Unknown` → 0) |
| Personal history of cancer | `previousMalignancy` | 1 / 0 |
| Family history of lung cancer | `familyHistory` | 1 / 0 |
| Smoking status | `smokingStatus` | Current=1, Former=0 |
| Smoking intensity | `cigarettesPerDay` | `((cpd/10)^-1) - 0.4021541613` |
| Duration smoked | `yearsSmoked` | centered at 27 |
| Years since quit | `yearsSinceQuitting` | 0 if current; centered at 10 |
| Intercept | — | `-4.536696` |

Pack-years are **derived** for display only: `(cigarettesPerDay / 20) × yearsSmoked`. They are **not** a PLCOm2012 predictor.

### Coefficients (Ver1-13OCT2016-MT)

| Term | Beta |
|---|---|
| Age | `0.0778895` |
| Education | `-0.0811569` |
| BMI | `-0.0251066` |
| COPD | `0.3606082` |
| Personal cancer | `0.4683545` |
| Family lung cancer | `0.584541` |
| Current smoker | `0.2675539` |
| Smoking intensity (transformed) | `-1.767578` |
| Duration smoked | `0.031949` |
| Years quit | `-0.0312719` |
| Intercept | `-4.536696` |

---

## Clinical flags (not in the percentage)

Symptoms remain separate so acute findings do not distort the validated probability.

| Symptom | Severity |
|---|---|
| Hemoptysis | Urgent |
| Weight loss | Urgent |
| Persistent cough / dyspnea / chest pain / hoarseness / fatigue | Attention |

---

## Never-smoker behavior

For `Never smoker`:

- PLCOm2012noRace is **not applied**
- UI shows **N/A** with an explicit reason
- Clinical flags can still appear

---

## Worked example (Excel reference defaults)

**Profile**

- Age 60, education 4, BMI 25.8  
- Current smoker, 20 cig/day, 30 years smoked, quit = 0  
- COPD = Yes; personal cancer = No; family history = No  

**Result:** ≈ **2.19%** 6-year probability (Intermediate band).

---

## Local clinical considerations (not in the percentage)

The Risk support screen always shows a **Local clinical considerations** panel so healthcare workers can weigh known PLCOm2012noRace gaps for Philippine / East–Southeast Asian field settings. These are clinician judgment prompts — they never alter `percent`.

| Consideration | Typical signal source | Why it is shown |
|---|---|---|
| Never-smoker pattern (esp. women) | `smokingStatus`, `sexAtBirth` | Model was built on ever-smokers; Asian never-smoker lung cancer is a documented gap |
| Indoor air / cooking fuel | Biomass fuel, secondhand smoke checklist | No PLCO term for solid fuel, wok fumes, or ventilation |
| Outdoor ambient PM2.5 | Open-Meteo snapshot (if available) | US-derived model; Philippine ambient pollution not in score |
| Occupational exposures | Asbestos, silica, mining, construction | Informal/industrial dusts and fumes not in PLCO |
| Previous TB / scarring | `previousTuberculosis` | Distinct from COPD; locally important for symptoms/imaging |
| EGFR / molecular context | Population note only | Asian never-smoker EGFR enrichment cannot be inferred from the form |

Statuses: **Recorded** / **Not recorded** / **Unknown** / **Context only**. High-priority items are visually emphasized when present (e.g. female never-smoker + TB + biomass).

---

## Code entry points

| File | Role |
|---|---|
| `src/plcom2012-norace.ts` | Published coefficients + logistic probability |
| `src/risk-estimate.ts` | Screening mapping, bands, clinical flags, local considerations |
| `src/App.tsx` | Collects PLCO inputs; Risk support UI |
| `src/risk-estimate.test.ts` | Excel reference case + never-smoker / local-consideration checks |

---

## Known limitations

1. Population calibration is from PLCO (largely North American); Philippine performance is not re-validated here.
2. `Unknown` for COPD / cancer / family history is coded as **No** so binary predictors stay defined.
3. Local considerations surface gaps honestly; they are **not** a second scored model.
4. Environmental and LCP public data remain available elsewhere in the app but **do not** enter the PLCO %.
5. Nodule / imaging models (Brock NOD) are not included.
6. Non-commercial use framing follows the reference calculator notes.

When coefficients, predictor mapping, or local-consideration wording change, update this document in the same PR.

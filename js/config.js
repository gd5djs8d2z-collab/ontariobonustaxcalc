/**
 * config.js — OntarioBonusTaxCalc.ca Central Tax Configuration
 * Tax Year: 2026
 * Jurisdiction: Canada → Ontario (employment income / bonus withholding)
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL RATES, BRACKETS, AND THRESHOLDS.
 * To update for a new tax year: edit ONLY this file.
 * All calculator logic and displayed values reference this file exclusively.
 * Zero rates, thresholds, or dollar amounts may appear in index.html or calculator.js.
 *
 * CRA Bonus Withholding Method: T4032-ON Bonus Method (annualization)
 * The CRA T4032 bonus method annualizes the bonus as additional income on top of
 * the regular pay period income, calculates the marginal tax on the bonus alone,
 * then applies that marginal tax as the withholding. This is the standard method
 * used by Canadian payroll software for employer withholding on bonus payments.
 *
 * Sources:
 *   CRA T4032-ON: https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032on-jan/t4032on-january-general-information.html
 *   CRA Individual tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 *   ESDC EI 2026: https://www.canada.ca/en/employment-social-development/news/2025/09/canada-employment-insurance-commission-sets-the-2026-employment-insurance-premium-rate.html
 *   CPP 2026: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html
 */

const BONUS_CONFIG = {

  // ── Site Metadata ──────────────────────────────────────────────────────────
  siteName: "OntarioBonusTaxCalc.ca",
  siteUrl: "https://ontariobonustaxcalc.ca",
  taxYear: 2026,
  lastUpdated: "May 2026",
  jurisdiction: "Ontario, Canada",
  incomeType: "Employment income — bonus withholding estimation",

  // ── Bonus Withholding Method ───────────────────────────────────────────────
  // CRA T4032 Bonus Method (annualization):
  // 1. Determine regular pay period income (base salary ÷ pay periods)
  // 2. Annualize regular income: regular pay × pay periods
  // 3. Calculate tax on annualized regular income
  // 4. Add bonus to annualized regular income
  // 5. Calculate tax on (annualized regular + bonus)
  // 6. Tax on bonus = step 5 minus step 3
  // 7. Apply CPP and EI on bonus (subject to annual maximum thresholds)
  method: "CRA T4032 Bonus Method (Annualization)",

  // ── Pay Frequency Options ──────────────────────────────────────────────────
  payFrequencies: {
    weekly:      { label: "Weekly",       periods: 52  },
    biweekly:    { label: "Bi-weekly",    periods: 26  },
    semimonthly: { label: "Semi-monthly", periods: 24  },
    monthly:     { label: "Monthly",      periods: 12  }
  },

  // ── Federal Income Tax 2026 ────────────────────────────────────────────────
  // Source: CRA — federal bottom bracket reduced from 15% to 14% for 2026
  federal: {
    brackets: [
      { min: 0,       max: 58523,    rate: 0.14   },
      { min: 58523,   max: 117045,   rate: 0.205  },
      { min: 117045,  max: 181440,   rate: 0.26   },
      { min: 181440,  max: 258482,   rate: 0.29   },
      { min: 258482,  max: Infinity, rate: 0.33   }
    ],
    bpa: 16452,          // Basic Personal Amount (full)
    bpaBase: 14829,
    bpaAdditional: 1623,
    bpaPhaseoutStart: 181440,
    bpaPhaseoutEnd: 258482,
    creditRate: 0.14     // Non-refundable credit rate = lowest bracket rate
  },

  // ── Ontario Provincial Income Tax 2026 ────────────────────────────────────
  ontario: {
    brackets: [
      { min: 0,       max: 53891,    rate: 0.0505 },
      { min: 53891,   max: 107785,   rate: 0.0915 },
      { min: 107785,  max: 150000,   rate: 0.1116 },
      { min: 150000,  max: 220000,   rate: 0.1216 },
      { min: 220000,  max: Infinity, rate: 0.1316 }
    ],
    bpa: 12989,
    creditRate: 0.0505,
    surtax: {
      threshold1: 5818,  // 20% surtax on basic Ontario tax above this amount
      rate1: 0.20,
      threshold2: 7446,  // Additional 36% surtax on basic Ontario tax above this
      rate2: 0.36
    }
  },

  // ── Canada Pension Plan (CPP) 2026 ────────────────────────────────────────
  // Source: CRA T4032-ON 2026
  // THRESHOLD LOGIC: CPP on bonus is capped by annual maximum.
  // If employee has already contributed maxContribution1 from salary,
  // NO CPP1 is deducted from the bonus. Partial contributions apply if the
  // bonus pushes earnings to the YMPE ceiling mid-year.
  cpp: {
    basicExemption: 3500,
    ympe: 74600,               // CPP1 ceiling — Year's Maximum Pensionable Earnings
    yampe: 85000,              // CPP2 ceiling — Year's Additional Maximum Pensionable Earnings
    rate1: 0.0595,             // CPP1 employee rate
    rate2: 0.04,               // CPP2 employee rate (YMPE → YAMPE band)
    maxContribution1: 4230.45, // Maximum CPP1 employee contribution
    maxContribution2: 416.00   // Maximum CPP2 employee contribution
  },

  // ── Employment Insurance (EI) 2026 ────────────────────────────────────────
  // Source: ESDC 2026 premium announcement
  // THRESHOLD LOGIC: EI on bonus is capped by annual maximum insurable earnings.
  // If salary already exceeds maxInsurableEarnings, NO EI is deducted from bonus.
  ei: {
    rate: 0.0163,              // Employee rate per dollar of insurable earnings
    maxInsurableEarnings: 68900,
    maxPremium: 1123.07        // Maximum annual employee EI premium
  },

  // ── Source URLs (for display / citation) ──────────────────────────────────
  sources: {
    craT4032:    "https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032on-jan/t4032on-january-general-information.html",
    craBrackets: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html",
    esdc:        "https://www.canada.ca/en/employment-social-development/news/2025/09/canada-employment-insurance-commission-sets-the-2026-employment-insurance-premium-rate.html",
    cpp:         "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html"
  }

};

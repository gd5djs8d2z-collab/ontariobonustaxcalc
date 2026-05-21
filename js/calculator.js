/**
 * calculator.js — OntarioBonusTaxCalc.ca Calculation Engine
 * Tax Year: 2026 | Jurisdiction: Ontario, Canada
 *
 * Implements CRA T4032 Bonus Method (Annualization).
 * Reads exclusively from BONUS_CONFIG (js/config.js).
 * Zero hardcoded rates, thresholds, or dollar amounts in this file.
 *
 * METHOD (CRA T4032-ON Bonus Method):
 *   1. Annualize regular pay period income
 *   2. Calculate combined federal+Ontario tax on annualized regular income
 *   3. Add bonus to annualized income
 *   4. Calculate combined tax on (annualized regular + bonus)
 *   5. Tax on bonus = step 4 minus step 2
 *   6. CPP/EI applied on bonus subject to annual maximum thresholds
 *   7. Optional: RRSP deduction reduces taxable income
 *   8. Optional: additional withholding amount
 */
(function () {
  "use strict";

  const C = BONUS_CONFIG;

  // ── Utilities ──────────────────────────────────────────────────────────────

  function round2(n) { return Math.round(n * 100) / 100; }

  function fmt(n) {
    if (isNaN(n) || n === null) return "$0.00";
    var sign = n < 0 ? "-" : "";
    return sign + "$" + round2(Math.abs(n)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function fmtPct(r) { return (r * 100).toFixed(1) + "%"; }

  // ── Federal BPA (with phase-down) ─────────────────────────────────────────

  function getFederalBPA(income) {
    var f = C.federal;
    if (income <= f.bpaPhaseoutStart) return f.bpa;
    if (income >= f.bpaPhaseoutEnd)   return f.bpaBase;
    var fraction = (income - f.bpaPhaseoutStart) / (f.bpaPhaseoutEnd - f.bpaPhaseoutStart);
    return f.bpa - fraction * f.bpaAdditional;
  }

  // ── Progressive Bracket Tax ────────────────────────────────────────────────

  function calcBracketTax(taxableIncome, brackets) {
    var total = 0;
    var marginalRate = brackets[0].rate;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (taxableIncome <= b.min) continue;
      var upper = b.max === Infinity ? taxableIncome : Math.min(taxableIncome, b.max);
      var slice = upper - b.min;
      if (slice > 0) {
        total += slice * b.rate;
        marginalRate = b.rate;
      }
    }
    return { tax: round2(total), marginalRate: marginalRate };
  }

  // ── Ontario Surtax ─────────────────────────────────────────────────────────

  function calcOntarioSurtax(basicOntarioTax) {
    var s = C.ontario.surtax;
    var surtax = 0;
    if (basicOntarioTax > s.threshold1) {
      surtax += (basicOntarioTax - s.threshold1) * s.rate1;
    }
    if (basicOntarioTax > s.threshold2) {
      surtax += (basicOntarioTax - s.threshold2) * s.rate2;
    }
    return round2(surtax);
  }

  // ── Full Tax Calculation for a given annual income ─────────────────────────
  // Returns { federalTax, ontarioTax, marginalFedRate, marginalOntRate }

  function calcAnnualTax(annualIncome, rrspDeduction) {
    var deduction = rrspDeduction || 0;
    var taxableIncome = Math.max(0, annualIncome - deduction);

    // Federal
    var fedBPA = getFederalBPA(taxableIncome);
    var fedBPACredit = round2(fedBPA * C.federal.creditRate);
    var fedResult = calcBracketTax(taxableIncome, C.federal.brackets);
    var federalTax = Math.max(0, round2(fedResult.tax - fedBPACredit));

    // Ontario
    var ontBPACredit = round2(C.ontario.bpa * C.ontario.creditRate);
    var ontResult = calcBracketTax(taxableIncome, C.ontario.brackets);
    var basicOntarioTax = Math.max(0, round2(ontResult.tax - ontBPACredit));
    var surtax = calcOntarioSurtax(basicOntarioTax);
    var ontarioTax = round2(basicOntarioTax + surtax);

    return {
      federalTax: federalTax,
      ontarioTax: ontarioTax,
      marginalFedRate: fedResult.marginalRate,
      marginalOntRate: ontResult.marginalRate
    };
  }

  // ── CPP on Bonus ──────────────────────────────────────────────────────────
  // Calculates CPP1 and CPP2 contributions on a bonus amount given year-to-date
  // salary earnings. Respects annual maximum thresholds.
  // ytdSalary = salary earned so far this year (before bonus)

  function calcCPPOnBonus(ytdSalary, bonusAmount) {
    var cpp = C.cpp;
    var result = { cpp1: 0, cpp2: 0, total: 0, note: "" };

    // CPP1 — applies on earnings from basicExemption to ympe
    var ytdPensionable1 = Math.max(0, Math.min(ytdSalary, cpp.ympe) - cpp.basicExemption);
    var ytdCPP1Paid = Math.min(round2(ytdPensionable1 * cpp.rate1), cpp.maxContribution1);
    var cpp1Remaining = Math.max(0, round2(cpp.maxContribution1 - ytdCPP1Paid));

    if (cpp1Remaining <= 0) {
      result.cpp1 = 0;
      result.note = "CPP1 annual maximum already reached — no CPP1 deducted from bonus.";
    } else {
      // Bonus earnings subject to CPP1 (up to remaining room below YMPE)
      var cpp1EarningsRoom = Math.max(0, cpp.ympe - Math.max(ytdSalary, cpp.basicExemption));
      var cpp1BonusBand = Math.min(bonusAmount, cpp1EarningsRoom);
      result.cpp1 = Math.min(round2(cpp1BonusBand * cpp.rate1), cpp1Remaining);
    }

    // CPP2 — applies on earnings between ympe and yampe
    var ytdPensionable2 = Math.max(0, Math.min(ytdSalary, cpp.yampe) - cpp.ympe);
    var ytdCPP2Paid = Math.min(round2(ytdPensionable2 * cpp.rate2), cpp.maxContribution2);
    var cpp2Remaining = Math.max(0, round2(cpp.maxContribution2 - ytdCPP2Paid));

    if (cpp2Remaining <= 0) {
      result.cpp2 = 0;
    } else {
      var totalWithBonus = ytdSalary + bonusAmount;
      var cpp2Start = Math.max(ytdSalary, cpp.ympe);
      var cpp2BonusBand = Math.max(0, Math.min(totalWithBonus, cpp.yampe) - cpp2Start);
      result.cpp2 = Math.min(round2(cpp2BonusBand * cpp.rate2), cpp2Remaining);
    }

    result.total = round2(result.cpp1 + result.cpp2);
    return result;
  }

  // ── EI on Bonus ───────────────────────────────────────────────────────────
  // Calculates EI premium on bonus given year-to-date insurable earnings.
  // EI stops when maxInsurableEarnings is reached.

  function calcEIOnBonus(ytdSalary, bonusAmount) {
    var ei = C.ei;
    var ytdEIPaid = Math.min(round2(ytdSalary * ei.rate), ei.maxPremium);
    var eiRemaining = Math.max(0, round2(ei.maxPremium - ytdEIPaid));

    if (eiRemaining <= 0) {
      return { ei: 0, note: "EI annual maximum already reached — no EI deducted from bonus." };
    }

    var eiEarningsRoom = Math.max(0, ei.maxInsurableEarnings - ytdSalary);
    var eiBonusBand = Math.min(bonusAmount, eiEarningsRoom);
    var eiOnBonus = Math.min(round2(eiBonusBand * ei.rate), eiRemaining);
    return { ei: eiOnBonus, note: "" };
  }

  // ── Main Bonus Tax Calculation ─────────────────────────────────────────────

  function calcBonusTax(inputs) {
    var baseSalary    = parseFloat(inputs.baseSalary)    || 0;
    var bonusAmount   = parseFloat(inputs.bonusAmount)   || 0;
    var payPeriods    = parseInt(inputs.payPeriods)      || 26;
    var rrspDeduction = parseFloat(inputs.rrspDeduction) || 0;
    var additionalWithholding = parseFloat(inputs.additionalWithholding) || 0;

    if (bonusAmount <= 0) return { error: "Please enter a bonus amount greater than zero." };
    if (baseSalary < 0 || bonusAmount < 0) return { error: "Income values must be non-negative." };

    // Step 1: Annualized regular income
    var regularPeriodIncome = round2(baseSalary / payPeriods);
    var annualizedRegularIncome = round2(regularPeriodIncome * payPeriods);
    // (same as baseSalary — clarified for transparency)

    // Step 2: Tax on annualized regular income
    var taxOnRegular = calcAnnualTax(annualizedRegularIncome, rrspDeduction);
    var totalTaxOnRegular = round2(taxOnRegular.federalTax + taxOnRegular.ontarioTax);

    // Step 3: Tax on (annualized regular income + bonus)
    var annualizedWithBonus = round2(annualizedRegularIncome + bonusAmount);
    var taxOnWithBonus = calcAnnualTax(annualizedWithBonus, rrspDeduction);
    var totalTaxOnWithBonus = round2(taxOnWithBonus.federalTax + taxOnWithBonus.ontarioTax);

    // Step 4: Tax attributable to bonus
    var taxOnBonus = Math.max(0, round2(totalTaxOnWithBonus - totalTaxOnRegular));
    var federalWithholding = Math.max(0, round2(taxOnWithBonus.federalTax - taxOnRegular.federalTax));
    var ontarioWithholding = Math.max(0, round2(taxOnWithBonus.ontarioTax - taxOnRegular.ontarioTax));

    // Step 5: CPP and EI on bonus
    var cppResult = calcCPPOnBonus(baseSalary, bonusAmount);
    var eiResult  = calcEIOnBonus(baseSalary, bonusAmount);

    // Step 6: Total deductions
    var totalDeductions = round2(taxOnBonus + cppResult.total + eiResult.ei + additionalWithholding);
    var netBonus = round2(bonusAmount - totalDeductions);

    // Step 7: Effective withholding rate
    var effectiveWithholdingRate = bonusAmount > 0 ? round2((totalDeductions / bonusAmount) * 100) : 0;

    // Step 8: Annualized income estimate (for marginal rate context)
    var annualizedIncomeWithBonus = round2(baseSalary + bonusAmount);

    // Marginal rates at the bonus income level
    var marginalFedRate = taxOnWithBonus.marginalFedRate;
    var marginalOntRate = taxOnWithBonus.marginalOntRate;
    var combinedMarginalRate = round2((marginalFedRate + marginalOntRate) * 100);

    return {
      // Inputs
      baseSalary:    baseSalary,
      bonusAmount:   bonusAmount,
      payPeriods:    payPeriods,
      rrspDeduction: rrspDeduction,
      additionalWithholding: additionalWithholding,

      // Results
      grossBonus:              bonusAmount,
      federalWithholding:      federalWithholding,
      ontarioWithholding:      ontarioWithholding,
      taxOnBonus:              taxOnBonus,
      cpp1:                    cppResult.cpp1,
      cpp2:                    cppResult.cpp2,
      cppTotal:                cppResult.total,
      ei:                      eiResult.ei,
      additionalWithholding:   additionalWithholding,
      totalDeductions:         totalDeductions,
      netBonus:                netBonus,

      // Rates
      effectiveWithholdingRate:   effectiveWithholdingRate,
      marginalFedRate:            marginalFedRate,
      marginalOntRate:            marginalOntRate,
      combinedMarginalRate:       combinedMarginalRate,

      // Context
      annualizedIncomeWithBonus:  annualizedIncomeWithBonus,
      cppNote: cppResult.note,
      eiNote:  eiResult.note,

      // Format helper
      fmt: fmt
    };
  }

  // ── DOM Rendering ──────────────────────────────────────────────────────────

  function renderResults(r) {
    if (r.error) {
      showError(r.error);
      return;
    }
    hideError();

    // Primary results
    setHtml("res-gross-bonus",    r.fmt(r.grossBonus));
    setHtml("res-net-bonus",      r.fmt(r.netBonus));
    setHtml("res-total-deductions", r.fmt(r.totalDeductions));

    // Withholding breakdown
    setHtml("res-federal-wh",    r.fmt(r.federalWithholding));
    setHtml("res-ontario-wh",    r.fmt(r.ontarioWithholding));
    setHtml("res-cpp1",          r.fmt(r.cpp1));
    setHtml("res-cpp2",          r.fmt(r.cpp2));
    setHtml("res-ei",            r.fmt(r.ei));
    setHtml("res-additional-wh", r.fmt(r.additionalWithholding));

    // Rate summary
    setHtml("res-effective-rate",  r.effectiveWithholdingRate.toFixed(1) + "%");
    setHtml("res-combined-marginal", r.combinedMarginalRate.toFixed(1) + "%");
    setHtml("res-marginal-fed",    fmtPct(r.marginalFedRate));
    setHtml("res-marginal-ont",    fmtPct(r.marginalOntRate));
    setHtml("res-annualized",      r.fmt(r.annualizedIncomeWithBonus));

    // CPP/EI threshold notes
    var cppNoteEl = document.getElementById("cpp-threshold-note");
    if (cppNoteEl) cppNoteEl.textContent = r.cppNote || "";
    var eiNoteEl = document.getElementById("ei-threshold-note");
    if (eiNoteEl) eiNoteEl.textContent = r.eiNote || "";

    // Show results section
    var section = document.getElementById("results-section");
    if (section) section.style.display = "block";

    // Scroll to results on mobile
    if (window.innerWidth < 768) {
      setTimeout(function() {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  function setHtml(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
  }

  function showError(msg) {
    var el = document.getElementById("calc-error");
    if (el) { el.textContent = msg; el.style.display = "block"; }
    var section = document.getElementById("results-section");
    if (section) section.style.display = "none";
  }

  function hideError() {
    var el = document.getElementById("calc-error");
    if (el) { el.textContent = ""; el.style.display = "none"; }
  }

  // ── Public Interface ───────────────────────────────────────────────────────

  window.runBonusCalc = function () {
    var inputs = {
      baseSalary:    document.getElementById("input-salary").value,
      bonusAmount:   document.getElementById("input-bonus").value,
      payPeriods:    document.getElementById("input-pay-freq").value,
      rrspDeduction: document.getElementById("input-rrsp").value,
      additionalWithholding: document.getElementById("input-additional-wh").value
    };
    var result = calcBonusTax(inputs);
    renderResults(result);
  };

  // Expose for examples/inline use
  window._calcBonusTax = calcBonusTax;
  window._fmt = fmt;

})();

/* GA4 — Calc-HQ Network Analytics (single injection point) */
(function(){if(!window.__GA4_LOADED){window.__GA4_LOADED=true;var id="G-W4SWZ1YRS2";var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+id;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag("js",new Date());gtag("config",id);}})();

/**
 * OntarioBonusTaxCalc.ca — Ontario Payroll Cluster Network Tools
 * Ontario cluster only. Self excluded at render time.
 * Hub: https://calc-hq.ca
 */

const NETWORK_TOOLS = [
  {
    name: "Ontario Take Home Calc",
    desc: "Estimate your Ontario net pay after federal tax, provincial tax, CPP, EI, and OHP.",
    url: "https://ontariotakehomecalc.ca",
    live: true
  },
  {
    name: "Ontario Income Tax Calc",
    desc: "See every federal and Ontario tax bracket, your effective vs marginal rate, and surtax.",
    url: "https://ontarioincometaxcalc.ca",
    live: true
  },
  {
    name: "Ontario Raise Calc",
    desc: "Calculate your after-tax take-home change from a raise or salary increase.",
    url: "https://ontarioraisecalc.ca",
    live: true
  },
  {
    name: "Marginal Tax Calc",
    desc: "Find your combined federal and Ontario marginal tax rate on any income level.",
    url: "https://marginaltaxcalc.ca",
    live: true
  }
];

const CURRENT_SITE = "https://ontariobonustaxcalc.ca";

function renderFooter() {
  var footerEl = document.getElementById("network-footer");
  if (!footerEl) return;

  var relatedTools = NETWORK_TOOLS.filter(function(t) {
    return t.live && t.url !== CURRENT_SITE;
  });

  var relatedHtml = relatedTools.map(function(t) {
    return '<a class="related-card" href="' + t.url + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="rc-name">' + t.name + '</div>' +
      '<div class="rc-desc">' + t.desc + '</div>' +
      '</a>';
  }).join("");

  footerEl.innerHTML =
    '<div class="footer-inner">' +
      '<div class="footer-grid">' +
        '<div class="footer-col footer-col-related">' +
          '<div class="footer-col-head">Related Tools</div>' +
          '<div class="footer-related-grid">' + relatedHtml + '</div>' +
        '</div>' +
        '<div class="footer-col">' +
          '<div class="footer-col-head">More Tools</div>' +
          '<a href="https://calc-hq.ca" target="_blank" rel="noopener noreferrer">calc-hq.ca</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<div class="footer-col-head">Pages</div>' +
          '<a href="/">Home</a>' +
          '<a href="/faq.html">FAQ</a>' +
          '<a href="/about.html">About</a>' +
          '<a href="/contact.html">Contact</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<div class="footer-col-head">Legal</div>' +
          '<a href="/privacy.html">Privacy Policy</a>' +
          '<a href="/disclaimer.html">Disclaimer</a>' +
          '<a href="/terms.html">Terms of Use</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<p>&copy; 2026 OntarioBonusTaxCalc.ca &mdash; Estimates only. Not tax advice. Consult a qualified tax professional for your specific situation.</p>' +
        '<p><a href="/privacy.html">Privacy</a> &middot; <a href="/contact.html">Contact</a> &middot; <a href="/disclaimer.html">Disclaimer</a></p>' +
      '</div>' +
    '</div>';
}

document.addEventListener("DOMContentLoaded", renderFooter);

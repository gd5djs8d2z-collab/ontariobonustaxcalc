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

  footerEl.innerHTML =
    '<div class="container">' +
      '<div class="footer-grid footer-grid-4">' +
        '<div class="footer-brand">' +
          '<div class="logo">\uD83C\uDF10 OntarioBonusTaxCalc.ca</div>' +
          '<p>Ontario bonus tax withholding calculations for 2026. All calculations run in your browser. No data stored.</p>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>PAGES</h4>' +
          '<a href="index.html">Home</a>' +
          '<a href="faq.html">FAQ</a>' +
          '<a href="about.html">About</a>' +
          '<a href="contact.html">Contact</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>LEGAL</h4>' +
          '<a href="privacy.html">Privacy Policy</a>' +
          '<a href="disclaimer.html">Disclaimer</a>' +
          '<a href="terms.html">Terms of Use</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>RELATED TOOLS</h4>' +
          '<div id="related-tools"></div>' +
          '<a href="https://calc-hq.ca/" class="more-tools-link" rel="noopener"><strong>More Tools</strong> \u2192 Calc-HQ.ca</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>\u00A9 2026 OntarioBonusTaxCalc.ca \u2014 Part of the <a href="https://calc-hq.ca/" rel="noopener">Calc-HQ.ca</a> network</span>' +
        '<span>For informational purposes only. Not tax advice.</span>' +
      '</div>' +
    '</div>';

  renderFooterRelatedTools();
}

function renderFooterRelatedTools() {
  var container = document.getElementById("related-tools");
  if (!container) return;

  var html = "";
  NETWORK_TOOLS.forEach(function (tool) {
    if (!tool.live) return;
    if (tool.url === CURRENT_SITE) return;

    html += '<a href="' + tool.url + '" rel="noopener">' + tool.name + '</a>';
  });

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderFooter);

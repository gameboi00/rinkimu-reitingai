const categoryWeights = {
  education: 0.1,
  experience: 0.2,
  finance: 0.25,
  integrity: 0.45,
};

const taxBenchmarkRate = 20;
const taxLawUrl =
  "https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.171369/ZpoTIeHmpt";
const publicTrustBaseline = 80;
const publicFactsReviewedAt = "2026-06-14";

const publicFactWeights = {
  severity: { low: 8, medium: 20, severe: 40, critical: 50 },
  status: {
    final: 1,
    institutionalFinding: 1,
    firstInstance: 0.45,
    investigation: 0.2,
    context: 0,
  },
  source: { official: 1, wire: 0.9, media: 0.7 },
};

function publicFactImpact(fact) {
  if (!fact.scoreEligible) return 0;
  const severity = publicFactWeights.severity[fact.severity] || 0;
  const status = publicFactWeights.status[fact.legalStatus] || 0;
  const source = publicFactWeights.source[fact.sourceTier] || 0;
  const eventDate = new Date(`${fact.date}T00:00:00`);
  const reviewedDate = new Date(`${publicFactsReviewedAt}T00:00:00`);
  const yearsOld = Math.max(
    0,
    (reviewedDate - eventDate) / (365.25 * 24 * 60 * 60 * 1000),
  );
  const recency = Math.max(0.75, 1 - yearsOld * 0.03);
  const direction = fact.type === "positive" ? 1 : -1;
  return Math.round(direction * severity * status * source * recency);
}

function publicTrustBreakdown(publicFacts) {
  const scoredByCase = new Map();

  publicFacts.forEach((fact) => {
    const impact = publicFactImpact(fact);
    if (!impact) return;
    const caseKey = fact.caseKey || fact.title;
    const current = scoredByCase.get(caseKey);
    if (!current || Math.abs(impact) > Math.abs(current.impact)) {
      scoredByCase.set(caseKey, { fact, impact });
    }
  });

  const scoredFacts = [...scoredByCase.values()];
  const positive = Math.min(
    20,
    scoredFacts.reduce((sum, item) => sum + Math.max(0, item.impact), 0),
  );
  const negative = scoredFacts.reduce(
    (sum, item) => sum + Math.min(0, item.impact),
    0,
  );

  return {
    baseline: publicTrustBaseline,
    positive,
    negative,
    scoredFacts,
    score: Math.max(
      0,
      Math.min(100, Math.round(publicTrustBaseline + positive + negative)),
    ),
  };
}

function taxSolidarityScore(rate) {
  const ratio = Math.min(rate / taxBenchmarkRate, 1);
  return Math.round(ratio ** 2 * 100);
}

function liquidityScore(finance) {
  const yearsOfIncome = finance.money / Math.max(finance.income, 1);
  if (yearsOfIncome >= 1) return 0;
  if (yearsOfIncome > 0.5) return Math.round(40 * (1 - yearsOfIncome));
  if (yearsOfIncome >= 0.05) return 100;
  return finance.money === 0 ? 55 : 75;
}

function debtAssetScore(finance) {
  if (finance.registeredAssets === 0 && finance.loans === 0) return 55;
  if (finance.registeredAssets === 0) return 10;
  const ratio = finance.loans / finance.registeredAssets;
  if (ratio >= 0.15 && ratio <= 0.8) return 100;
  if (ratio < 0.15) return 75;
  if (ratio <= 1) return 55;
  return 20;
}

function grantedLoansScore(finance) {
  if (finance.grantedLoans === 0) return 100;
  const ratio = finance.grantedLoans / Math.max(finance.income, 1);
  return Math.max(0, Math.round(100 - ratio * 100));
}

function businessInterestScore(finance) {
  return Math.max(0, 100 - finance.businessInterests * 30);
}

function financeBreakdown(finance) {
  return {
    tax: taxSolidarityScore(finance.effectiveRate),
    liquidity: liquidityScore(finance),
    debtAsset: debtAssetScore(finance),
    grantedLoans: grantedLoansScore(finance),
    business: businessInterestScore(finance),
  };
}

function financialProfileScore(finance) {
  const parts = financeBreakdown(finance);
  return Math.round(
    parts.tax * 0.45 +
      parts.liquidity * 0.2 +
      parts.debtAsset * 0.15 +
      parts.grantedLoans * 0.1 +
      parts.business * 0.1,
  );
}

const vrkBase =
  "https://www.vrk.lt/kandidatai-kandidatu-sarasai-2024-sei?srcUrl=%2Frinkimai%2F1544%2Frnk1870%2Fkandidatai%2F";

const curatedCandidates = [
  {
    id: "ruslanas-baranovas",
    name: "Ruslanas Baranovas",
    party: "Lietuvos socialdemokratų partija",
    district: "Vilniaus pietinė Nr. 11",
    initials: "RB",
    color: "#9a4d55",
    vrkId: "2437150",
    scores: {
      education: 95,
      experience: 74,
      finance: 0,
      integrity: 0,
    },
    community: { average: 0, count: 0 },
    finance: {
      year: 2023,
      income: 46590.43,
      tax: 9264.09,
      effectiveRate: 19.88,
      assets: 0,
      registeredAssets: 0,
      securities: 0,
      money: 0,
      grantedLoans: 0,
      loans: 0,
      businessInterests: 0,
      businessNames: [],
    },
    facts: [
      {
        status: "VRK",
        text: "Filosofijos mokslų daktaras; VRK biografijoje nurodytos studijos Vilniaus ir Turino universitetuose.",
        source: "bio",
      },
      {
        status: "VRK",
        text: "Nuo 2020 m. dirbo Seimo kanceliarijos patarėju; anksčiau buvo VU jaunesnysis tyrėjas ir mokytojas.",
        source: "bio",
      },
      {
        status: "VRK 2023",
        text: "Deklaruota 46 590,43 Eur pajamų ir 9 264,09 Eur mokėtino pajamų mokesčio.",
        source: "tax",
      },
    ],
    publicFacts: [
      {
        type: "positive",
        title: "Aukšta akademinė kvalifikacija",
        text: "VRK biografijoje nurodytas filosofijos mokslų daktaro laipsnis, darbas Vilniaus universitete ir mokytojo patirtis.",
        date: "2024-09-01",
        displayStatus: "Patvirtinta VRK",
        legalStatus: "context",
        severity: "low",
        sourceTier: "official",
        scoreEligible: false,
        scoreReason: "Jau įvertinta išsilavinimo ir darbo patirties kategorijose.",
        url: "https://www.vrk.lt/2024-seimo/rezultatai?srcUrl=/rinkimai/1544/rnk1870/kandidatai/KandidatasBiografija_rkndId-2437150.html",
      },
      {
        type: "positive",
        title: "Išrinktas 2024–2028 m. kadencijos Seimo nariu",
        text: "Seimo svetainė nurodo, kad Ruslanas Baranovas yra Seimo narys nuo 2024 m. lapkričio 14 d.",
        date: "2024-11-14",
        displayStatus: "Oficialus faktas",
        legalStatus: "context",
        severity: "low",
        sourceTier: "official",
        scoreEligible: false,
        scoreReason: "Rinkimų mandatas vertinamas darbo patirties, o ne patikimumo dalyje.",
        url: "https://www.lrs.lt/sip/portal.show?p_r=35299&p_k=1&p_a=498&p_asm_id=84705",
      },
      {
        type: "context",
        title: "Neigiamų sprendimų peržiūrėtuose šaltiniuose nerasta",
        text: "Tai nėra pažyma apie nepriekaištingą reputaciją: ji reiškia tik tai, kad šio piloto peržiūrėtuose oficialiuose šaltiniuose balą mažinančio sprendimo neužfiksuota.",
        date: publicFactsReviewedAt,
        displayStatus: "Paieškos ribotumas",
        legalStatus: "context",
        severity: "low",
        sourceTier: "official",
        scoreEligible: false,
        scoreReason: "Duomenų nebuvimas savaime balų neprideda.",
        url: "https://www.lrs.lt/sip/portal.show?p_r=35299&p_k=1&p_a=498&p_asm_id=84705",
      },
    ],
  },
  {
    id: "gintautas-paluckas",
    name: "Gintautas Paluckas",
    party: "Lietuvos socialdemokratų partija",
    district: "Utenos Nr. 51",
    initials: "GP",
    color: "#b04f55",
    vrkId: "2437189",
    scores: {
      education: 80,
      experience: 94,
      finance: 0,
      integrity: 0,
    },
    community: { average: 0, count: 0 },
    finance: {
      year: 2023,
      income: 269637.38,
      tax: 42936.44,
      effectiveRate: 15.92,
      assets: 2138592,
      registeredAssets: 402500,
      securities: 1700000,
      money: 36092,
      grantedLoans: 0,
      loans: 225579,
      businessInterests: 2,
      businessNames: ["Garnis, UAB", "Emus, UAB"],
    },
    facts: [
      {
        status: "VRK",
        text: "Vilniaus universitete 2003 m. baigė informatikos studijas.",
        source: "bio",
      },
      {
        status: "VRK",
        text: "VRK nurodo Seimo nario, Vilniaus vicemero, savivaldybės administracijos direktoriaus ir UAB direktoriaus patirtį.",
        source: "bio",
      },
      {
        status: "VRK 2023",
        text: "Deklaruota 269 637,38 Eur pajamų ir 42 936,44 Eur mokėtino pajamų mokesčio.",
        source: "tax",
      },
    ],
    publicFacts: [
      {
        type: "positive",
        title: "Ilga vadovavimo ir viešojo administravimo patirtis",
        text: "VRK biografijoje nurodytos Seimo nario, Vilniaus vicemero ir savivaldybės administracijos direktoriaus pareigos.",
        date: "2024-09-01",
        displayStatus: "Patvirtinta VRK",
        legalStatus: "context",
        severity: "low",
        sourceTier: "official",
        scoreEligible: false,
        scoreReason: "Jau įvertinta darbo patirties kategorijoje.",
        url: "https://www.vrk.lt/2024-seimo/rezultatai?srcUrl=/rinkimai/1544/rnk1870/kandidatai/KandidatasBiografija_rkndId-2437189.html",
      },
      {
        type: "negative",
        title: "Galutinis apkaltinamasis nuosprendis dėl piktnaudžiavimo",
        text: "2012 m. Lietuvos Aukščiausiasis Teismas paliko galioti apkaltinamąjį nuosprendį dėl piktnaudžiavimo tarnybine padėtimi Vilniaus savivaldybės viešajame pirkime.",
        date: "2012-04-03",
        displayStatus: "Galutinis nuosprendis",
        legalStatus: "final",
        severity: "severe",
        sourceTier: "wire",
        scoreEligible: true,
        caseKey: "paluckas-2012-piktnaudziavimas",
        scoreReason: "Galutinis sprendimas dėl elgesio einant viešas pareigas tiesiogiai susijęs su patikimumu.",
        url: "https://apnews.com/article/a85c94bd8f0188dd3b8dc2476291bb41",
      },
      {
        type: "context",
        title: "2025 m. atsistatydino iš ministro pirmininko pareigų",
        text: "Atsistatydinimas įvyko vykstant institucijų tyrimams ir viešai diskusijai dėl verslo ryšių. Pats atsistatydinimas nėra kaltės nustatymas, todėl atskiro balo nemažina.",
        date: "2025-07-31",
        displayStatus: "Kontekstas",
        legalStatus: "context",
        severity: "medium",
        sourceTier: "wire",
        scoreEligible: false,
        scoreReason: "Procesai ir įtarimai negali būti prilyginti galutiniam sprendimui.",
        url: "https://apnews.com/article/a85c94bd8f0188dd3b8dc2476291bb41",
      },
    ],
  },
  {
    id: "remigijus-zemaitaitis",
    name: "Remigijus Žemaitaitis",
    party: "Politinė partija „Nemuno Aušra“",
    district: "Kelmės–Šilalės Nr. 41",
    initials: "RŽ",
    color: "#4c6388",
    vrkId: "2437045",
    scores: {
      education: 80,
      experience: 96,
      finance: 0,
      integrity: 0,
    },
    community: { average: 0, count: 0 },
    finance: {
      year: 2023,
      income: 106476.29,
      tax: 11414.13,
      effectiveRate: 10.72,
      individualIncome: 44200,
      individualDeductions: 4300,
      assets: 843507,
      registeredAssets: 379801,
      securities: 206183,
      money: 257523,
      grantedLoans: 0,
      loans: 166492,
      businessInterests: 4,
      businessNames: [
        "Dervira, UAB",
        "Statyk pats, UAB",
        "Pamario starta, UAB",
        "Dervira ir partneriai, UAB",
      ],
    },
    facts: [
      {
        status: "VRK",
        text: "Vilniaus universiteto Teisės fakultete 2005 m. įgijo teisininko išsilavinimą.",
        source: "bio",
      },
      {
        status: "VRK",
        text: "VRK nurodo darbą teismuose, mero patarėjo pareigas ir Seimo nario patirtį 2009–2024 m.",
        source: "bio",
      },
      {
        status: "VRK 2023",
        text: "Deklaruota 106 476,29 Eur pajamų ir 11 414,13 Eur mokėtino pajamų mokesčio; 44 200 Eur sudarė individualios veiklos pajamos.",
        source: "tax",
      },
    ],
    publicFacts: [
      {
        type: "positive",
        title: "Ilgametė parlamentinė ir teisinė patirtis",
        text: "VRK biografijoje nurodytas teisininko išsilavinimas, darbas teismuose ir Seimo nario patirtis nuo 2009 m.",
        date: "2024-09-01",
        displayStatus: "Patvirtinta VRK",
        legalStatus: "context",
        severity: "low",
        sourceTier: "official",
        scoreEligible: false,
        scoreReason: "Jau įvertinta išsilavinimo ir darbo patirties kategorijose.",
        url: "https://www.vrk.lt/2024-seimo/rezultatai?srcUrl=/rinkimai/1544/rnk1870/kandidatai/KandidatasBiografija_rkndId-2437045.html",
      },
      {
        type: "negative",
        title: "Konstitucinio Teismo išvada dėl priesaikos sulaužymo",
        text: "2024 m. balandžio 25 d. Konstitucinis Teismas konstatavo, kad viešais pasisakymais buvo šiurkščiai pažeista Konstitucija ir sulaužyta Seimo nario priesaika.",
        date: "2024-04-25",
        displayStatus: "Galutinė KT išvada",
        legalStatus: "institutionalFinding",
        severity: "critical",
        sourceTier: "official",
        scoreEligible: true,
        caseKey: "zemaitaitis-2023-pasisakymai",
        scoreReason: "Aukščiausio lygmens oficiali išvada tiesiogiai susijusi su konstitucine Seimo nario atsakomybe.",
        url: "https://www.lrkt.lt/lt/apie-teisma/naujienos/1331/seimo-narys-remigijus-zemaitaitis-sulauze-priesaika-ir-siurksciai-pazeide-konstitucija:656",
      },
      {
        type: "negative",
        title: "Pirmosios instancijos nuosprendis dėl neapykantos kurstymo",
        text: "2025 m. gruodžio 4 d. Vilniaus teismas skyrė 5 000 Eur baudą. Šaltinis aiškiai nurodo, kad sprendimas tuo metu dar nebuvo galutinis.",
        date: "2025-12-04",
        displayStatus: "Neįsiteisėjęs nuosprendis",
        legalStatus: "firstInstance",
        severity: "critical",
        sourceTier: "wire",
        scoreEligible: true,
        caseKey: "zemaitaitis-2023-pasisakymai",
        scoreReason: "Taikomas mažesnis proceso koeficientas ir nedubliuojama su KT išvada dėl tų pačių pasisakymų.",
        url: "https://apnews.com/article/29e66a87c858671b835a5189f5266e8f",
      },
    ],
  },
];

let candidates = curatedCandidates;

function prepareCandidate(candidate) {
  candidate.scores.finance = financialProfileScore(candidate.finance);
  if (candidate.automatedReview) {
    candidate.publicTrust = {
      baseline: publicTrustBaseline,
      positive: 0,
      negative: candidate.scores.integrity - publicTrustBaseline,
      scoredFacts: [],
      score: candidate.scores.integrity,
    };
  } else {
    candidate.publicTrust = publicTrustBreakdown(candidate.publicFacts);
    candidate.scores.integrity = candidate.publicTrust.score;
  }
  return candidate;
}

curatedCandidates.forEach(prepareCandidate);

const candidateList = document.querySelector("#candidateList");
const searchInput = document.querySelector("#searchInput");
const partyFilter = document.querySelector("#partyFilter");
const sortSelect = document.querySelector("#sortSelect");
const emptyState = document.querySelector("#emptyState");
const candidateDialog = document.querySelector("#candidateDialog");
const dialogContent = document.querySelector("#dialogContent");
const infoDialog = document.querySelector("#infoDialog");
const infoContent = document.querySelector("#infoContent");

function sourceUrl(candidate, type) {
  const pages = {
    tax: "KandidatasTurtoPajDekl",
    interests: "KandidatasPrivInterDekl",
    bio: "KandidatasBiografija",
  };
  const page = pages[type] || pages.bio;
  return `${vrkBase}${page}_rkndId-${candidate.vrkId}.html`;
}

function weightedScore(candidate) {
  const available = Object.entries(categoryWeights).filter(
    ([key]) => candidate.scores[key] !== null,
  );
  const weightSum = available.reduce((sum, [, weight]) => sum + weight, 0);
  const points = available.reduce(
    (sum, [key, weight]) => sum + candidate.scores[key] * weight,
    0,
  );
  return Math.round(points / weightSum);
}

function reputationCap(integrityScore) {
  if (integrityScore < 40) return 45;
  if (integrityScore < 60) return 65;
  if (integrityScore < 75) return 80;
  return 100;
}

function totalScore(candidate) {
  return Math.min(
    weightedScore(candidate),
    reputationCap(candidate.scores.integrity),
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function starDisplay(value) {
  const rounded = Math.round(value);
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function populateParties() {
  partyFilter.querySelectorAll("option:not(:first-child)").forEach((option) => {
    option.remove();
  });
  [...new Set(candidates.map((candidate) => candidate.party))]
    .sort((a, b) => a.localeCompare(b, "lt"))
    .forEach((party) => {
      const option = document.createElement("option");
      option.value = party;
      option.textContent = party;
      partyFilter.append(option);
    });
}

function getVisibleCandidates() {
  const query = searchInput.value.trim().toLocaleLowerCase("lt");
  const party = partyFilter.value;
  const sort = sortSelect.value;
  const filtered = candidates.filter((candidate) => {
    const matchesQuery = `${candidate.name} ${candidate.party}`
      .toLocaleLowerCase("lt")
      .includes(query);
    return matchesQuery && (party === "all" || candidate.party === party);
  });

  return filtered.sort((a, b) => {
    if (sort === "community") return b.community.average - a.community.average;
    if (sort === "name") return a.name.localeCompare(b.name, "lt");
    return totalScore(b) - totalScore(a);
  });
}

function renderCandidates() {
  const visible = getVisibleCandidates();
  emptyState.hidden = visible.length > 0;
  candidateList.innerHTML = visible
    .map((candidate, index) => {
      const score = totalScore(candidate);
      const communityText = candidate.community.count
        ? `${candidate.community.average.toFixed(1)} · ${candidate.community.count} vertinimai`
        : "Dar nėra vertinimų";
      return `
        <article class="candidate-row">
          <span class="rank">${String(index + 1).padStart(2, "0")}</span>
          <div class="candidate">
            <span class="avatar" style="--avatar:${candidate.color}">${candidate.initials}</span>
            <div>
              <strong>${candidate.name}</strong>
              <small>${candidate.district}</small>
            </div>
          </div>
          <div class="party">${candidate.party}<small>2024 m. Seimo rinkimai</small></div>
          <div class="score-wrap">
            <span class="score-ring" style="--score:${score}"><strong>${score}</strong></span>
            <span class="score-label"><strong>Preliminarus</strong><span>iš 100 balų</span></span>
          </div>
          <div class="community">
            <span class="stars">${starDisplay(candidate.community.average)}</span>
            <small>${communityText}</small>
          </div>
          <button class="row-button" data-candidate="${candidate.id}" aria-label="Atverti ${candidate.name} profilį">→</button>
        </article>
      `;
    })
    .join("");
}

function openCandidate(candidate) {
  const score = totalScore(candidate);
  const scoreBeforeCap = weightedScore(candidate);
  const scoreCap = reputationCap(candidate.scores.integrity);
  const financeParts = financeBreakdown(candidate.finance);
  const labels = {
    education: "Išsilavinimas",
    experience: "Darbo patirtis",
    finance: "Finansinis profilis",
    integrity: "Viešas patikimumas",
  };

  dialogContent.innerHTML = `
    <div class="profile-header">
      <span class="avatar" style="--avatar:${candidate.color}">${candidate.initials}</span>
      <h2>${candidate.name}</h2>
      <p>${candidate.party} · ${candidate.district}</p>
    </div>
    <div class="profile-body">
      <p class="kicker">Preliminarus bendras balas: ${score}/100</p>
      <div class="score-breakdown">
        ${Object.entries(candidate.scores)
          .map(([key, value]) => {
            const weight = Math.round(categoryWeights[key] * 100);
            if (value === null) {
              return `
                <div class="score-line">
                  <span>${labels[key]} (${weight}%)</span>
                  <span class="bar"></span>
                  <strong>–</strong>
                </div>
              `;
            }
            return `
              <div class="score-line">
                <span>${labels[key]} (${weight}%)</span>
                <span class="bar"><i style="--width:${value}%"></i></span>
                <strong>${value}</strong>
              </div>
            `;
          })
          .join("")}
      </div>
      ${
        scoreBeforeCap > scoreCap
          ? `<p class="score-warning"><strong>Reputacijos ribotuvas:</strong> svertinis rezultatas būtų ${scoreBeforeCap}, tačiau ${candidate.scores.integrity}/100 viešo patikimumo balas apriboja bendrą rezultatą iki ${scoreCap}.</p>`
          : ""
      }
      <h3>${candidate.finance.year} m. deklaracijos skaičiai</h3>
      <ul class="fact-list">
        <li><strong>Pajamos:</strong> ${formatMoney(candidate.finance.income)}</li>
        <li><strong>Mokėtinas GPM:</strong> ${formatMoney(candidate.finance.tax)}</li>
        <li><strong>GPM ir visų pajamų santykis:</strong> ${candidate.finance.effectiveRate.toFixed(2).replace(".", ",")}%</li>
        <li><strong>20% etalono įvykdymas:</strong> ${Math.min(candidate.finance.effectiveRate / taxBenchmarkRate, 1).toLocaleString("lt-LT", { style: "percent", maximumFractionDigits: 1 })}</li>
        <li><strong>Deklaruotas turtas:</strong> ${formatMoney(candidate.finance.assets)}</li>
        <li><strong>Piniginės lėšos:</strong> ${formatMoney(candidate.finance.money)}</li>
        <li><strong>Suteiktos paskolos:</strong> ${formatMoney(candidate.finance.grantedLoans)}</li>
        <li><strong>Gautos paskolos:</strong> ${formatMoney(candidate.finance.loans)}</li>
        <li><strong>Akcininko ryšiai:</strong> ${candidate.finance.businessInterests}</li>
      </ul>
      <p class="source-note">
        Finansinis balas skaičiuojamas pagal formulę
        (GPM ir pajamų santykis / 20%)² × 100. Todėl 20% gauna 100 balų,
        16% – apie 64, o 10% – 25 balus. <a href="${taxLawUrl}" target="_blank"
        rel="noreferrer">2023 m. GPM įstatymas ↗</a>
      </p>
      <h3>Finansinio profilio išskaidymas</h3>
      ${
        candidate.scores.finance ===
        Math.max(...candidates.map((item) => item.scores.finance))
          ? '<p class="kicker">Arčiausiai etaloninio profilio šioje 3 kandidatų imtyje</p>'
          : ""
      }
      <div class="score-breakdown">
        ${[
          ["Mokestinis solidarumas", financeParts.tax, 45],
          ["Piniginių lėšų proporcija", financeParts.liquidity, 20],
          ["Turto ir paskolos dermė", financeParts.debtAsset, 15],
          ["Nesuteiktos paskolos", financeParts.grantedLoans, 10],
          ["Verslo interesų paprastumas", financeParts.business, 10],
        ]
          .map(
            ([label, value, weight]) => `
              <div class="score-line">
                <span>${label} (${weight}%)</span>
                <span class="bar"><i style="--width:${value}%"></i></span>
                <strong>${value}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
      <p class="source-note">
        Etalonas: registruotas turtas su saikinga paskola, 5–50% metinių pajamų
        dydžio piniginės lėšos, nesuteiktos paskolos ir nėra aktyvių akcininko
        ryšių. „Piniginės lėšos“ gali būti laikomos banke – VRK jų nevadina
        grynaisiais.
      </p>
      ${
        candidate.finance.businessNames.length
          ? `<p class="source-note"><strong>Deklaruoti akcininko ryšiai:</strong> ${candidate.finance.businessNames.join(", ")}. Tai galimo interesų ir laiko konflikto signalas, ne įrodytas pareigų nevykdymas. <a href="${sourceUrl(candidate, "interests")}" target="_blank" rel="noreferrer">Interesų deklaracija ↗</a></p>`
          : `<p class="source-note"><strong>Akcininko ryšių nenustatyta</strong> pateiktoje VRK privačių interesų deklaracijoje. <a href="${sourceUrl(candidate, "interests")}" target="_blank" rel="noreferrer">Interesų deklaracija ↗</a></p>`
      }
      <h3>VRK patvirtinti faktai</h3>
      <ul class="fact-list">
        ${candidate.facts
          .map(
            (fact) => `
              <li>
                <span class="status-badge">${fact.status}</span>
                ${fact.text}
                <a href="${sourceUrl(candidate, fact.source)}" target="_blank" rel="noreferrer">Atverti šaltinį ↗</a>
              </li>
            `,
          )
          .join("")}
      </ul>
      <h3>Teigiama ir neigiama vieša informacija</h3>
      <p class="source-note">
        ${
          candidate.automatedReview
            ? "Automatiškai peržiūrėti vienodos struktūros VRK anketos laukai. Nepriklausoma teismų ir žiniasklaidos paieška šiam kandidatui dar neatlikta."
            : `Rankinė viešų šaltinių peržiūra atlikta ${publicFactsReviewedAt}. Susiję sprendimai grupuojami pagal tą patį atvejį, todėl ta pati veika nevertinama pakartotinai.`
        }
      </p>
      <ul class="fact-list public-facts">
        ${candidate.publicFacts
          .map((fact) => {
            const rawImpact = publicFactImpact(fact);
            const isCounted = candidate.publicTrust.scoredFacts.some(
              (item) => item.fact === fact,
            );
            const impact = isCounted ? rawImpact : 0;
            const impactText = impact
              ? `${impact > 0 ? "+" : ""}${impact} bal.`
              : rawImpact
                ? "0 bal. (nedubliuojama)"
                : "0 bal.";
            return `
              <li class="${fact.type}">
                <span class="status-badge ${fact.type}">${fact.type === "positive" ? "Teigiama" : fact.type === "negative" ? "Neigiama" : "Kontekstas"}</span>
                <strong>${fact.title}</strong>
                <small>${fact.date} · ${fact.displayStatus} · ${impactText}</small>
                <p>${fact.text}</p>
                <span class="fact-reason">${fact.scoreReason}</span>
                <a href="${fact.url}" target="_blank" rel="noreferrer">Atverti šaltinį ↗</a>
              </li>
            `;
          })
          .join("")}
      </ul>
      <h3>Viešo patikimumo skaičiavimas</h3>
      <p class="source-note">
        ${candidate.publicTrust.baseline} bazė
        ${candidate.publicTrust.positive ? `+ ${candidate.publicTrust.positive} teigiami` : ""}
        ${candidate.publicTrust.negative ? `− ${Math.abs(candidate.publicTrust.negative)} neigiami` : ""}
        = <strong>${candidate.scores.integrity}/100</strong>.
        Bazė nėra reputacijos pažyma. Galutinis sprendimas vertinamas 100%,
        pirmosios instancijos nuosprendis 45%, tyrimas 20%; senumo koeficientas
        negali sumažinti rimto fakto svorio žemiau 75%.
      </p>
      <div class="rating-box">
        <strong>Jūsų vertinimas</strong>
        <p>Šis balsas prototipe saugomas tik jūsų naršyklėje.</p>
        <div class="rating-buttons" data-rating="${candidate.id}">
          ${[1, 2, 3, 4, 5]
            .map(
              (rating) =>
                `<button data-value="${rating}" aria-label="${rating} iš 5">${rating} ★</button>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  const savedRating = localStorage.getItem(`rating:${candidate.id}`);
  if (savedRating) {
    dialogContent
      .querySelector(`[data-value="${savedRating}"]`)
      ?.classList.add("selected");
  }
  candidateDialog.showModal();
}

function openInfo(type) {
  const isMethod = type === "method";
  infoContent.innerHTML = `
    <div class="info-body">
      <p class="kicker">${isMethod ? "Atvira metodika" : "Projekto principai"}</p>
      <h2>${isMethod ? "Balas turi būti atkuriamas." : "Faktai prieš verdiktus."}</h2>
      ${
        isMethod
          ? `
            <p>Dabartinis pilotinis balas remiasi VRK 2024 m. kandidatų biografijomis, 2023 m. deklaracijomis ir iki ${publicFactsReviewedAt} peržiūrėtais viešais šaltiniais.</p>
            <h3>Finansinis rodiklis</h3>
            <p>Finansinis balas sudarytas iš penkių dalių: GPM santykio (45%), piniginių lėšų proporcijos (20%), turto ir paskolos dermės (15%), suteiktų paskolų (10%) ir aktyvių verslo ryšių (10%).</p>
            <p>Etaloninis profilis turi registruoto turto su saikinga paskola, ribotą likvidžių lėšų rezervą, nėra suteikęs paskolų ir neturi aktyvių akcininko ryšių. Tai projekto normatyvinis pasirinkimas, ne įstatymo nustatytas „idealus žmogus“.</p>
            <p>20% mokestinis etalonas 2023 m. taikytas pagrindinei darbo pajamų daliai iki 60 VDU. Mokesčių komponentas = min(1, faktinis santykis / 20%)² × 100.</p>
            <p>Įstatyme taip pat buvo teisėtas bendras 15% tarifas ir individualios veiklos pajamų mokesčio kreditas, sukuriantis maždaug 5–15% tarifą. Todėl mažesnis santykis vertinamas kaip mažesnis mokestinis solidarumas, o ne kaip įrodytas mokesčių vengimas.</p>
            <h3>Viešas patikimumas</h3>
            <p>Viešas patikimumas sudaro 45% bendro balo ir veikia kaip būtinas slenkstis. Patikimumas iki 39 bendrą balą riboja iki 45, 40–59 – iki 65, 60–74 – iki 80. Diplomas ar ilga karjera negali kompensuoti rimtų reputacijos pažeidimų.</p>
            <p>Pradinis patikimumo balas yra 80. Neigiami faktai vertinami pagal rimtumą, proceso būseną, šaltinio lygį ir senumą. Galutinis teismo ar Konstitucinio Teismo sprendimas turi visą svorį, pirmosios instancijos nuosprendis – 45%, tyrimas – 20%. Viešas kaltinimas be oficialaus proceso balo nekeičia.</p>
            <p>Vienos veikos teisiniai etapai grupuojami ir taikomas tik stipriausias poveikis. Karjera, išsilavinimas ir turtas viešo patikimumo dalyje antrą kartą nevertinami. Teigiamų patikimumo taškų suma ribojama iki 20.</p>
            <h3>Išsilavinimas ir patirtis</h3>
            <p>Baigtas aukštasis išsilavinimas laikomas neutraliu 80 balų lygiu. Daktaro laipsnis suteikia nedidelį priedą, o nebaigtas aukštasis ar tik vidurinis išsilavinimas balą mažina gerokai. Išsilavinimas sudaro tik 10%.</p>
            <p>Patirtis sudaro 20%. Didžiausias skirtumas daromas tarp visiško naujoko, profesinės patirties turinčio kandidato ir žmogaus, turėjusio realią vadovavimo bei atsakomybės patirtį.</p>
          `
          : `
            <ul>
              <li>Kiekvienas balą keičiantis faktas turi tiesioginį šaltinį.</li>
              <li>Kandidatui turi būti suteikta teisė pateikti paaiškinimą.</li>
              <li>Ekspertinis balas nebus maišomas su vartotojų balsais.</li>
              <li>Trūkstami duomenys nebus automatiškai laikomi neigiamu faktu.</li>
              <li>Metodikos pakeitimai bus viešai versijuojami.</li>
            </ul>
          `
      }
    </div>
  `;
  infoDialog.showModal();
}

async function loadAllCandidates() {
  candidateList.innerHTML = '<p class="loading-state">Kraunami VRK kandidatų duomenys…</p>';
  try {
    const response = await fetch("data/candidates-2024.json?v=20260614-2");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const curatedIds = new Set(curatedCandidates.map((candidate) => candidate.vrkId));
    const generated = payload.candidates
      .filter((candidate) => !curatedIds.has(candidate.vrkId))
      .map(prepareCandidate);
    candidates = [...curatedCandidates, ...generated];
  } catch (error) {
    console.error("Nepavyko įkelti visų kandidatų:", error);
    candidates = curatedCandidates;
  }
  populateParties();
  renderCandidates();
}

loadAllCandidates();

[searchInput, partyFilter, sortSelect].forEach((control) => {
  control.addEventListener("input", renderCandidates);
});

candidateList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-candidate]");
  if (!button) return;
  const candidate = candidates.find((item) => item.id === button.dataset.candidate);
  if (candidate) openCandidate(candidate);
});

dialogContent.addEventListener("click", (event) => {
  const button = event.target.closest("[data-value]");
  if (!button) return;
  const group = button.closest("[data-rating]");
  group.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  localStorage.setItem(`rating:${group.dataset.rating}`, button.dataset.value);
});

document.querySelector("#methodButton").addEventListener("click", () => openInfo("method"));
document.querySelector("#principlesButton").addEventListener("click", () => openInfo("principles"));

document.querySelectorAll(".dialog-close").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

[candidateDialog, infoDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

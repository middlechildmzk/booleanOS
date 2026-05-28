"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "General Technical" | "AI / ML" | "Cybersecurity" | "Cleared / GovCon" | "Healthcare" | "Nursing / Allied" | "Data Engineering" | "Product / Design" | "Sales / GTM";

type Criteria = {
  titles: string[];
  must: string[];
  nice: string[];
  locations: string[];
  credentials: string[];
  companies: string[];
  exclusions: string[];
};

type Query = {
  id: string;
  platform: string;
  type: string;
  query: string;
  launchable: boolean;
  score: number;
  explanation: string;
  warnings: string[];
};

type Lane = {
  name: string;
  purpose: string;
  platform: string;
  risk: string;
  query: string;
  whenToUse: string;
};

type Feedback = {
  type: string;
  mode: Mode;
  role: string;
  query?: string;
  term?: string;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  mode: Mode;
  jd: string;
  criteria: Criteria | null;
  createdAt: string;
};

const modes: Mode[] = ["General Technical", "AI / ML", "Cybersecurity", "Cleared / GovCon", "Healthcare", "Nursing / Allied", "Data Engineering", "Product / Design", "Sales / GTM"];

const emptyCriteria: Criteria = { titles: [], must: [], nice: [], locations: [], credentials: [], companies: [], exclusions: [] };

const templates = [
  {
    name: "Cleared DevSecOps Engineer",
    mode: "Cleared / GovCon" as Mode,
    role: "Senior DevSecOps Engineer",
    jd: "Senior DevSecOps Engineer with active TS/SCI clearance in Washington D.C. metro. Must have AWS GovCloud, Terraform, Kubernetes, Docker, CI/CD, Linux, Python or Bash, Ansible, RMF, ATO, NIST, FedRAMP, and DoD experience. Security+ or CISSP preferred. Target companies include GDIT, Leidos, Booz Allen, CACI, SAIC, Peraton, ManTech."
  },
  {
    name: "AI/ML Engineer",
    mode: "AI / ML" as Mode,
    role: "Machine Learning Engineer",
    jd: "Machine Learning Engineer focused on LLM applications, RAG, vector databases, NLP, Python, PyTorch, TensorFlow, MLOps, model evaluation, embeddings, and production ML systems. Remote or San Francisco preferred."
  },
  {
    name: "Registered Nurse",
    mode: "Nursing / Allied" as Mode,
    role: "Registered Nurse",
    jd: "Registered Nurse with RN license, BLS, acute care, patient assessment, EMR experience, Epic preferred, hospital setting, Minneapolis or St. Paul area."
  },
  {
    name: "Data Engineer",
    mode: "Data Engineering" as Mode,
    role: "Data Engineer",
    jd: "Data Engineer with Snowflake, dbt, Airflow, Python, SQL, Spark, data modeling, ETL, orchestration, cloud data platforms, and analytics engineering experience."
  },
  {
    name: "Product Manager",
    mode: "Product / Design" as Mode,
    role: "Product Manager",
    jd: "Product Manager with B2B SaaS, roadmap ownership, discovery, analytics, stakeholder management, user research, product strategy, and technical product experience."
  }
];

const titleSynonyms: Record<Mode, string[]> = {
  "General Technical": ["Software Engineer", "Systems Engineer", "Platform Engineer", "Application Developer"],
  "AI / ML": ["Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer", "NLP Engineer", "Applied Scientist"],
  "Cybersecurity": ["Cybersecurity Engineer", "Security Engineer", "Cloud Security Engineer", "AppSec Engineer", "GRC Analyst", "SOC Analyst"],
  "Cleared / GovCon": ["DevSecOps Engineer", "Platform Engineer", "Cloud Engineer", "Systems Engineer", "Site Reliability Engineer"],
  "Healthcare": ["Healthcare Analyst", "Clinical Analyst", "Epic Analyst", "Healthcare IT Specialist"],
  "Nursing / Allied": ["Registered Nurse", "RN", "Licensed Practical Nurse", "LPN", "Clinical Nurse"],
  "Data Engineering": ["Data Engineer", "Analytics Engineer", "ETL Developer", "Data Platform Engineer"],
  "Product / Design": ["Product Manager", "Senior Product Manager", "Product Owner", "UX Designer", "Product Designer"],
  "Sales / GTM": ["Account Executive", "Sales Development Representative", "Customer Success Manager", "Revenue Operations Manager"]
};

const modeSkills: Record<Mode, string[]> = {
  "General Technical": ["JavaScript", "TypeScript", "React", "Node", "Python", "AWS", "Kubernetes", "CI/CD"],
  "AI / ML": ["Python", "PyTorch", "TensorFlow", "MLOps", "LLM", "RAG", "NLP", "vector database", "embeddings", "model evaluation"],
  "Cybersecurity": ["SIEM", "SOC", "AppSec", "cloud security", "IAM", "NIST", "RMF", "FedRAMP", "CISSP", "Security+"],
  "Cleared / GovCon": ["AWS GovCloud", "Azure Government", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python", "Bash", "Ansible", "RMF", "ATO", "NIST", "FedRAMP", "DoD", "IC", "GovCon"],
  "Healthcare": ["Epic", "Cerner", "HL7", "FHIR", "HIPAA", "clinical workflows", "EMR", "EHR"],
  "Nursing / Allied": ["RN", "BLS", "ACLS", "patient assessment", "acute care", "triage", "Epic", "EMR"],
  "Data Engineering": ["Snowflake", "dbt", "Airflow", "Python", "SQL", "Spark", "ETL", "data modeling", "Databricks"],
  "Product / Design": ["roadmap", "discovery", "analytics", "Figma", "user research", "B2B SaaS", "stakeholder management"],
  "Sales / GTM": ["prospecting", "Salesforce", "HubSpot", "enterprise sales", "pipeline", "ARR", "SaaS", "MEDDIC"]
};

const locationSuggestions = ["Washington D.C. Metro", "Northern Virginia", "Arlington VA", "Reston VA", "Chantilly VA", "Remote", "Minnesota Twin Cities", "Minneapolis", "St. Paul", "Waconia", "San Francisco", "New York", "Austin", "Denver"];
const clearanceSuggestions = ["Secret", "Top Secret", "TS/SCI", "Polygraph", "CI Poly", "Full Scope Poly", "Public Trust", "Security+", "CISSP", "RN", "BLS", "ACLS"];
const targetCompanies = ["GDIT", "Leidos", "Booz Allen", "CACI", "SAIC", "Peraton", "ManTech", "Maximus", "Lockheed Martin", "Northrop Grumman", "Raytheon", "Palantir", "Anduril", "Databricks", "OpenAI", "Anthropic"];

function unique(items: string[]) {
  return Array.from(new Set(items.map(x => String(x || "").trim()).filter(Boolean)));
}

function quote(term: string) {
  return /\s|\//.test(term) && !/^".*"$/.test(term) ? `"${term}"` : term;
}

function orGroup(items: string[], max = 8) {
  const clean = unique(items).slice(0, max).map(quote);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  return `(${clean.join(" OR ")})`;
}

function notGroup(items: string[], google = false) {
  const clean = unique(items).slice(0, 12);
  if (!clean.length) return "";
  if (google) return clean.map(x => `-${quote(x)}`).join(" ");
  return `NOT (${clean.map(quote).join(" OR ")})`;
}

function andJoin(items: string[]) {
  return items.filter(Boolean).join(" AND ");
}

function extract(mode: Mode, role: string, jd: string): Criteria {
  const combined = `${role}\n${jd}`;
  const lower = combined.toLowerCase();
  const titles: string[] = [];
  const roleLower = role.toLowerCase();

  if (/devops|devsecops/i.test(combined)) titles.push("DevOps Engineer", "DevSecOps Engineer", "Platform Engineer", "Site Reliability Engineer");
  if (/machine learning|llm|\bml\b|ai engineer/i.test(combined)) titles.push("Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer");
  if (/nurse|registered nurse|\brn\b/i.test(combined)) titles.push("Registered Nurse", "RN", "Clinical Nurse");
  if (/data engineer|etl|snowflake|dbt/i.test(combined)) titles.push("Data Engineer", "Analytics Engineer", "ETL Developer");
  if (/product manager|product owner/i.test(combined)) titles.push("Product Manager", "Senior Product Manager", "Product Owner");
  if (/security|cyber|soc|appsec/i.test(combined) && mode === "Cybersecurity") titles.push("Security Engineer", "Cybersecurity Engineer", "Cloud Security Engineer");
  if (!titles.length && role.trim()) titles.push(role.trim());
  if (!titles.length) titles.push(...titleSynonyms[mode].slice(0, 3));

  const skills = modeSkills[mode].filter(s => lower.includes(s.toLowerCase()) || lower.includes(s.toLowerCase().replace("+", "")));
  const adjacent = modeSkills[mode].filter(s => !skills.includes(s)).slice(0, 5);
  const credentials = clearanceSuggestions.filter(s => lower.includes(s.toLowerCase().replace("+", "")) || lower.includes(s.toLowerCase()));
  const companies = targetCompanies.filter(s => lower.includes(s.toLowerCase()));
  const locations: string[] = [];
  if (/washington|\bdc\b|d\.c\.|district of columbia|dmv/i.test(combined)) locations.push("Washington D.C. Metro");
  if (/northern virginia|nova|arlington|reston|herndon|chantilly|virginia/i.test(combined)) locations.push("Northern Virginia");
  if (/remote/i.test(combined)) locations.push("Remote");
  if (/minnesota|minneapolis|st paul|waconia/i.test(combined)) locations.push("Minnesota Twin Cities");
  for (const loc of locationSuggestions) if (lower.includes(loc.toLowerCase())) locations.push(loc);

  const baseExclusions = ["intern", "student", "sales", "recruiter"];
  const exclusions = mode === "Cleared / GovCon" ? ["help desk", "desktop support", "intern", "student", "sales", "recruiter"] : baseExclusions;

  return {
    titles: unique(titles),
    must: unique(skills.length ? skills : modeSkills[mode].slice(0, 5)),
    nice: unique(adjacent),
    locations: unique(locations),
    credentials: unique(credentials),
    companies: unique(companies),
    exclusions: unique(exclusions)
  };
}

function scoreQuery(query: string, launchable: boolean, criteria: Criteria) {
  let score = 72;
  if (criteria.titles.length > 1) score += 6;
  if (criteria.must.length >= 3 && criteria.must.length <= 8) score += 8;
  if (criteria.exclusions.length) score += 5;
  if (criteria.locations.length) score += 3;
  if (launchable) score += 2;
  if (query.length > 900) score -= 8;
  if (criteria.must.length > 9) score -= 6;
  return Math.max(35, Math.min(98, score));
}

function buildQueries(criteria: Criteria): Query[] {
  const titles = orGroup(criteria.titles, 8);
  const must = orGroup(criteria.must, 10);
  const nice = orGroup([...criteria.must, ...criteria.nice], 14);
  const creds = orGroup(criteria.credentials, 8);
  const loc = orGroup(criteria.locations, 6);
  const companies = orGroup(criteria.companies, 8);
  const exclusions = notGroup(criteria.exclusions);
  const googleExclusions = notGroup(criteria.exclusions, true);

  const raw = [
    { id: "li-balanced", platform: "LinkedIn Recruiter", type: "Balanced", query: andJoin([titles, must, creds, loc, exclusions]), launchable: false, explanation: "Best first pass for recruiter platforms. Balanced title, skill, location, and exclusion logic." },
    { id: "li-broad", platform: "LinkedIn Recruiter", type: "Broad", query: andJoin([titles, nice, creds || loc, exclusions]), launchable: false, explanation: "Use when the initial search is too thin. Expands into adjacent skills and preferred terms." },
    { id: "li-narrow", platform: "LinkedIn Recruiter", type: "Narrow", query: andJoin([titles, must, creds, companies, loc, exclusions]), launchable: false, explanation: "Use when results are noisy. Adds target companies and tighter requirement logic." },
    { id: "xray-linkedin", platform: "Google X-Ray LinkedIn", type: "X-Ray", query: ["site:linkedin.com/in", titles, must, creds, loc, googleExclusions].filter(Boolean).join(" "), launchable: true, explanation: "Launchable Google X-Ray for public LinkedIn profile discovery." },
    { id: "xray-github", platform: "GitHub X-Ray", type: "X-Ray", query: ["site:github.com", titles, must, loc, googleExclusions].filter(Boolean).join(" "), launchable: true, explanation: "Use for technical evidence, repos, and open source signals." },
    { id: "ats", platform: "ATS / Avature", type: "Conservative", query: andJoin([titles, orGroup(criteria.must.slice(0, 5), 5), creds, exclusions]), launchable: false, explanation: "Simpler syntax for ATS or resume database rediscovery." },
    { id: "clearance", platform: "ClearanceJobs / Dice", type: "Clearance Focus", query: andJoin([titles, orGroup(criteria.credentials, 8), orGroup(criteria.must.slice(0, 6), 6), loc, exclusions]), launchable: false, explanation: "Copy/paste into clearance or technical resume databases. Does not verify clearance." }
  ];

  return raw.filter(q => q.query.trim()).map(q => ({ ...q, score: scoreQuery(q.query, q.launchable, criteria), warnings: healthWarnings(q.query, criteria, q.platform) }));
}

function healthWarnings(query: string, criteria: Criteria, platform: string) {
  const warnings: string[] = [];
  if (!criteria.titles.length) warnings.push("No title anchor.");
  if (!criteria.exclusions.length) warnings.push("No exclusions active.");
  if (criteria.must.length > 9) warnings.push("Many must-haves may overconstrain results.");
  if (query.length > 900) warnings.push("Long query. Consider splitting into lanes.");
  if (platform.includes("ATS") && (query.match(/\(/g) || []).length > 3) warnings.push("ATS query may be too complex.");
  return warnings;
}

function buildLanes(criteria: Criteria): Lane[] {
  return [
    { name: "Direct-fit lane", purpose: "Find people who match the most literal version of the role.", platform: "LinkedIn Recruiter", risk: "Medium", query: andJoin([orGroup(criteria.titles), orGroup(criteria.must.slice(0, 7)), orGroup(criteria.credentials), notGroup(criteria.exclusions)]), whenToUse: "Run first when title and requirements are clear." },
    { name: "Adjacent-title lane", purpose: "Catch profiles with different titles but similar work.", platform: "LinkedIn Recruiter", risk: "Medium-high noise", query: andJoin([orGroup(unique([...criteria.titles, ...criteria.nice]).slice(0, 10)), orGroup(criteria.must.slice(0, 5)), notGroup(criteria.exclusions)]), whenToUse: "Use if direct-fit is too small." },
    { name: "Google X-Ray lane", purpose: "Supplement platform searches with public profile discovery.", platform: "Google", risk: "Lower control, useful recall", query: ["site:linkedin.com/in", orGroup(criteria.titles), orGroup(criteria.must.slice(0, 7)), notGroup(criteria.exclusions, true)].filter(Boolean).join(" "), whenToUse: "Use when LinkedIn Recruiter results look stale or thin." },
    { name: "Rediscovery lane", purpose: "Conservative ATS or CRM search for known candidates.", platform: "ATS / CRM", risk: "Low syntax risk", query: andJoin([orGroup(criteria.titles.slice(0, 4)), orGroup(criteria.must.slice(0, 4)), orGroup(criteria.credentials.slice(0, 4))]), whenToUse: "Use for Avature, ATS, CRM, or resume database rediscovery." }
  ];
}

function queryHealth(criteria: Criteria | null, queries: Query[]) {
  if (!criteria) return { risk: "Waiting", issues: ["Analyze a role to score query health."], wins: [] as string[] };
  const issues: string[] = [];
  const wins: string[] = [];
  if (!criteria.titles.length) issues.push("No title anchor."); else wins.push("Title anchors are present.");
  if (criteria.titles.length === 1) issues.push("Only one title. Add adjacent titles for recall.");
  if (!criteria.must.length) issues.push("No must-have requirements."); else wins.push("Must-have requirements are present.");
  if (!criteria.exclusions.length) issues.push("No exclusions. Noise risk is higher."); else wins.push("Exclusions are active.");
  if (criteria.must.length > 9) issues.push("Too many must-haves. Split into lanes.");
  if (queries.some(q => q.warnings.length)) issues.push("One or more query cards have warnings.");
  return { risk: issues.length > 3 ? "High" : issues.length ? "Medium" : "Low", issues, wins };
}

function buildMemo(role: string, mode: Mode, criteria: Criteria | null, lanes: Lane[]) {
  if (!criteria) return "Analyze a role first.";
  return `Search strategy for ${role || "this role"}\n\nMode: ${mode}\n\nRecommended first move: run the direct-fit lane, then use Google X-Ray if LinkedIn results are thin.\n\nCore search criteria:\n- Titles: ${criteria.titles.join(", ") || "None"}\n- Must-haves: ${criteria.must.join(", ") || "None"}\n- Credentials/clearance: ${criteria.credentials.join(", ") || "None"}\n- Locations: ${criteria.locations.join(", ") || "None"}\n\nRisks to align on:\n- If the pool is too small, loosen title or location before dropping core technical requirements.\n- Public clearance language is a breadcrumb only, not verified clearance.\n- Search should be split into lanes rather than one overloaded Boolean string.\n\nLanes:\n${lanes.map(l => `- ${l.name}: ${l.whenToUse}`).join("\n")}`;
}

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("Cleared / GovCon");
  const [role, setRole] = useState("Senior DevSecOps Engineer");
  const [jd, setJd] = useState(templates[0].jd);
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<Query[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  useEffect(() => {
    try {
      setFeedback(JSON.parse(localStorage.getItem("booleanos.feedback") || "[]"));
      setProjects(JSON.parse(localStorage.getItem("booleanos.projects") || "[]"));
      setFavorites(JSON.parse(localStorage.getItem("booleanos.favorites") || "[]"));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("booleanos.feedback", JSON.stringify(feedback)); }, [feedback]);
  useEffect(() => { localStorage.setItem("booleanos.projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("booleanos.favorites", JSON.stringify(favorites)); }, [favorites]);

  const queries = useMemo(() => criteria ? buildQueries(criteria) : [], [criteria]);
  const lanes = useMemo(() => criteria ? buildLanes(criteria) : [], [criteria]);
  const health = useMemo(() => queryHealth(criteria, queries), [criteria, queries]);
  const memo = useMemo(() => buildMemo(role, mode, criteria, lanes), [role, mode, criteria, lanes]);
  const runFirst = queries.find(q => q.id === "li-balanced") || queries[0];
  const memoryInsights = useMemo(() => {
    const sameMode = feedback.filter(f => f.mode === mode);
    const worked = sameMode.filter(f => f.type === "worked").length;
    const broad = sameMode.filter(f => f.type === "too_broad").length;
    const narrow = sameMode.filter(f => f.type === "too_narrow").length;
    const never = sameMode.filter(f => f.type === "never_suggest").map(f => f.term).filter(Boolean);
    const always = sameMode.filter(f => f.type === "always_include").map(f => f.term).filter(Boolean);
    return { sameMode: sameMode.length, worked, broad, narrow, never: unique(never as string[]), always: unique(always as string[]) };
  }, [feedback, mode]);

  function loadTemplate(index: number) {
    const t = templates[index];
    setMode(t.mode);
    setRole(t.role);
    setJd(t.jd);
    setCriteria(null);
    setChanges([`Loaded template: ${t.name}`]);
  }

  function analyzeRole() {
    const next = extract(mode, role, jd);
    if (memoryInsights.never.length) {
      next.must = next.must.filter(x => !memoryInsights.never.includes(x));
      next.nice = next.nice.filter(x => !memoryInsights.never.includes(x));
    }
    if (memoryInsights.always.length) next.must = unique([...next.must, ...memoryInsights.always]);
    setCriteria(next);
    setChanges([
      `Approved ${next.titles.length} title criteria.`,
      `Approved ${next.must.length} must-have criteria.`,
      memoryInsights.always.length ? `Memory added always-include terms: ${memoryInsights.always.join(", ")}.` : "No always-include memory terms yet.",
      memoryInsights.never.length ? `Memory removed never-suggest terms: ${memoryInsights.never.join(", ")}.` : "No never-suggest terms yet."
    ]);
  }

  function addCriteria(key: keyof Criteria, value: string) {
    if (!criteria || !value.trim()) return;
    const next = { ...criteria, [key]: unique([...criteria[key], value]) };
    setCriteria(next);
  }

  function removeCriteria(key: keyof Criteria, value: string) {
    if (!criteria) return;
    const next = { ...criteria, [key]: criteria[key].filter(x => x !== value) };
    setCriteria(next);
  }

  function saveFeedback(type: string, term?: string) {
    const item: Feedback = { type, mode, role, query: selectedQuery?.query, term, createdAt: new Date().toISOString() };
    setFeedback([item, ...feedback].slice(0, 100));
    setChanges([`Feedback saved: ${type}${term ? ` (${term})` : ""}.`, ...changes].slice(0, 12));
  }

  function saveProject() {
    const item: Project = { id: crypto.randomUUID(), name: role || "Untitled project", mode, jd, criteria, createdAt: new Date().toISOString() };
    setProjects([item, ...projects].slice(0, 25));
    setChanges([`Saved project: ${item.name}.`, ...changes].slice(0, 12));
  }

  function favoriteQuery(q: Query) {
    setFavorites([q, ...favorites.filter(x => x.query !== q.query)].slice(0, 25));
    setChanges([`Favorited query: ${q.platform} ${q.type}.`, ...changes].slice(0, 12));
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function runGoogle(query: string) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function exportPlan() {
    const text = `# BooleanOS Search Plan\n\nRole: ${role}\nMode: ${mode}\n\n## Criteria\n${JSON.stringify(criteria, null, 2)}\n\n## Run First\n${runFirst?.platform || "None"} ${runFirst?.type || ""}\n${runFirst?.query || ""}\n\n## Lanes\n${lanes.map(l => `### ${l.name}\n${l.purpose}\n${l.query}`).join("\n\n")}\n\n## HM Memo\n${memo}`;
    downloadFile("booleanos-search-plan.md", text);
  }

  function exportSourcingOS() {
    const payload = { type: "booleanos.search_strategy", version: "2.0", role, mode, criteria, runFirst, lanes, humanApproved: true, noScraping: true, noAutoOutreach: true, exportedAt: new Date().toISOString() };
    downloadFile("booleanos-sourcingos-export.json", JSON.stringify(payload, null, 2));
    setChanges(["Created human-approved SourcingOS export payload.", ...changes].slice(0, 12));
  }

  function joinWaitlist() {
    if (!waitlistEmail.includes("@")) {
      setWaitlistStatus("Enter a valid email first.");
      return;
    }
    const list = JSON.parse(localStorage.getItem("booleanos.waitlist") || "[]");
    localStorage.setItem("booleanos.waitlist", JSON.stringify(unique([waitlistEmail, ...list])));
    setWaitlistStatus("Saved to local beta waitlist. Connect Supabase later for cloud capture.");
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <header className="mb-5 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-200">BooleanOS Full Live Build v2.1</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight">AI Sourcing Query Copilot</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Turn messy role intake into approved search criteria, sourcing lanes, Boolean strings, X-Ray searches, hiring-manager memos, feedback memory, and SourcingOS-ready exports.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveProject} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Save Project</button>
            <button onClick={exportPlan} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Export Plan</button>
            <button onClick={exportSourcingOS} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">SourcingOS Export</button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[390px_1fr_340px]">
        <aside className="space-y-4">
          <Panel title="1. Intake">
            <label className="block text-xs font-black uppercase text-slate-500">Template</label>
            <select onChange={e => loadTemplate(Number(e.target.value))} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm font-bold" defaultValue="0">
              {templates.map((t, i) => <option key={t.name} value={i}>{t.name}</option>)}
            </select>
            <label className="mt-4 block text-xs font-black uppercase text-slate-500">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as Mode)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm font-bold">
              {modes.map(m => <option key={m}>{m}</option>)}
            </select>
            <label className="mt-4 block text-xs font-black uppercase text-slate-500">Role title</label>
            <input value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm" />
            <label className="mt-4 block text-xs font-black uppercase text-slate-500">JD / notes</label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} className="mt-1 h-64 w-full rounded-2xl border border-slate-300 p-3 text-sm" />
            <button onClick={analyzeRole} className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">Analyze Role</button>
          </Panel>

          <Panel title="2. Active Search Criteria">
            {criteria ? <CriteriaEditor criteria={criteria} addCriteria={addCriteria} removeCriteria={removeCriteria} mode={mode} /> : <p className="text-sm text-slate-500">Analyze a role to activate editable search criteria.</p>}
          </Panel>
        </aside>

        <section className="space-y-4">
          <Panel title="AI Suggested Strategy Review">
            {!criteria ? <p className="text-sm text-slate-500">Click Analyze Role to generate search criteria.</p> : (
              <div className="grid gap-3 md:grid-cols-3">
                <DecisionCard title="Use in search" items={[...criteria.titles, ...criteria.must, ...criteria.credentials]} tone="indigo" />
                <DecisionCard title="Use as filters / context" items={[...criteria.locations, ...criteria.companies]} tone="amber" />
                <DecisionCard title="Avoid / exclude" items={criteria.exclusions} tone="rose" />
              </div>
            )}
          </Panel>

          <Panel title="Query Health">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${health.risk === "Low" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : health.risk === "High" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>Risk: {health.risk}</span>
              {runFirst ? <button onClick={() => runGoogle(runFirst.query)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Run First</button> : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MiniList title="Issues" items={health.issues} />
              <MiniList title="What looks good" items={health.wins} />
            </div>
          </Panel>

          <Panel title="Run First Recommendation">
            {runFirst ? <div>
              <p className="text-sm text-slate-600">Start with <b>{runFirst.platform} · {runFirst.type}</b>. If results are thin, use Broad. If results are noisy, use Narrow. If LinkedIn is weak, run Google X-Ray.</p>
              <pre className="query-box mono mt-3 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{runFirst.query}</pre>
            </div> : <p className="text-sm text-slate-500">Analyze a role first.</p>}
          </Panel>

          <Panel title="Search Lanes">
            <div className="grid gap-3">
              {lanes.length ? lanes.map(lane => <LaneCard key={lane.name} lane={lane} runGoogle={runGoogle} copy={copy} />) : <p className="text-sm text-slate-500">No lanes yet.</p>}
            </div>
          </Panel>

          <Panel title="Generated Queries">
            <div className="space-y-4">
              {queries.length ? queries.map(q => <QueryCard key={q.id} q={q} selected={selectedQuery?.id === q.id} onSelect={() => setSelectedQuery(q)} copy={copy} runGoogle={runGoogle} favorite={() => favoriteQuery(q)} />) : <p className="text-sm text-slate-500">No queries yet.</p>}
            </div>
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel title="3. Optimize and Learn">
            <div className="grid gap-2">
              <button onClick={() => saveFeedback("worked")} className="rounded-2xl bg-emerald-50 px-3 py-2 text-left text-sm font-black text-emerald-700 ring-1 ring-emerald-200">Worked well</button>
              <button onClick={() => saveFeedback("too_broad")} className="rounded-2xl bg-amber-50 px-3 py-2 text-left text-sm font-black text-amber-700 ring-1 ring-amber-200">Too broad</button>
              <button onClick={() => saveFeedback("too_narrow")} className="rounded-2xl bg-rose-50 px-3 py-2 text-left text-sm font-black text-rose-700 ring-1 ring-rose-200">Too narrow</button>
              <button onClick={() => saveFeedback("always_include", criteria?.must[0] || criteria?.credentials[0] || "")} className="rounded-2xl bg-indigo-50 px-3 py-2 text-left text-sm font-black text-indigo-700 ring-1 ring-indigo-200">Always include top term</button>
              <button onClick={() => saveFeedback("never_suggest", criteria?.exclusions[0] || "noise")} className="rounded-2xl bg-slate-100 px-3 py-2 text-left text-sm font-black text-slate-700 ring-1 ring-slate-200">Never suggest top exclusion</button>
            </div>
          </Panel>

          <Panel title="What Changed Because of Feedback">
            <MiniList title="Recent changes" items={changes.length ? changes : ["No feedback-driven changes yet."]} />
          </Panel>

          <Panel title="Local Learning">
            <div className="space-y-2 text-sm text-slate-700">
              <p><b>{memoryInsights.sameMode}</b> feedback events for {mode}</p>
              <p>Worked: {memoryInsights.worked} · Too broad: {memoryInsights.broad} · Too narrow: {memoryInsights.narrow}</p>
              <p>Always include: {memoryInsights.always.join(", ") || "None yet"}</p>
              <p>Never suggest: {memoryInsights.never.join(", ") || "None yet"}</p>
            </div>
          </Panel>

          <Panel title="HM Memo">
            <pre className="query-box max-h-80 overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">{memo}</pre>
            <button onClick={() => copy(memo)} className="mt-3 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy memo</button>
          </Panel>

          <Panel title="Hosted Beta Gate">
            <p className="text-sm text-slate-500">Local waitlist now. Supabase/Stripe can be connected later.</p>
            <input value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="email@example.com" className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2 text-xs" />
            <button onClick={joinWaitlist} className="mt-2 rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">Join Waitlist</button>
            {waitlistStatus ? <p className="mt-2 text-xs font-bold text-slate-600">{waitlistStatus}</p> : null}
          </Panel>

          <Panel title="Saved Projects">
            <SavedList items={projects.map(p => `${p.name} · ${p.mode}`)} empty="No projects saved yet." />
          </Panel>

          <Panel title="Favorite Queries">
            <SavedList items={favorites.map(f => `${f.platform} · ${f.type}`)} empty="No favorites yet." />
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white"><h2 className="mb-3 text-xl font-black">{title}</h2>{children}</section>;
}

function DecisionCard({ title, items, tone }: { title: string; items: string[]; tone: "indigo" | "amber" | "rose" }) {
  const toneClass = tone === "indigo" ? "bg-indigo-50 text-indigo-900 ring-indigo-100" : tone === "amber" ? "bg-amber-50 text-amber-900 ring-amber-100" : "bg-rose-50 text-rose-900 ring-rose-100";
  return <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}><div className="mb-2 text-xs font-black uppercase tracking-wide opacity-70">{title}</div><div className="flex flex-wrap gap-2">{items.length ? unique(items).map(item => <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-black ring-1 ring-white">{item}</span>) : <span className="text-sm opacity-70">None yet.</span>}</div></div>;
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><div className="mb-2 text-xs font-black uppercase text-slate-500">{title}</div>{items.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul> : <p className="text-sm text-slate-500">None.</p>}</div>;
}

function SavedList({ items, empty }: { items: string[]; empty: string }) {
  return <div className="space-y-2">{items.length ? items.slice(0, 6).map((item, idx) => <div key={idx} className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{item}</div>) : <p className="text-sm text-slate-500">{empty}</p>}</div>;
}

function CriteriaEditor({ criteria, addCriteria, removeCriteria, mode }: { criteria: Criteria; addCriteria: (key: keyof Criteria, value: string) => void; removeCriteria: (key: keyof Criteria, value: string) => void; mode: Mode }) {
  const groups: { key: keyof Criteria; label: string; suggestions: string[] }[] = [
    { key: "titles", label: "Target titles", suggestions: titleSynonyms[mode] },
    { key: "must", label: "Must-haves", suggestions: modeSkills[mode] },
    { key: "nice", label: "Preferred terms", suggestions: modeSkills[mode] },
    { key: "locations", label: "Locations", suggestions: locationSuggestions },
    { key: "credentials", label: "Credentials / clearance", suggestions: clearanceSuggestions },
    { key: "companies", label: "Target companies", suggestions: targetCompanies },
    { key: "exclusions", label: "Exclusions", suggestions: ["intern", "student", "help desk", "desktop support", "sales", "recruiter"] }
  ];
  return <div className="space-y-3">{groups.map(g => <CriteriaGroup key={g.key} group={g} values={criteria[g.key]} add={v => addCriteria(g.key, v)} remove={v => removeCriteria(g.key, v)} />)}</div>;
}

function CriteriaGroup({ group, values, add, remove }: { group: { key: keyof Criteria; label: string; suggestions: string[] }; values: string[]; add: (value: string) => void; remove: (value: string) => void }) {
  const [input, setInput] = useState("");
  const matches = group.suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)).slice(0, 5);
  return <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">{group.label}</div><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map(v => <button key={v} onClick={() => remove(v)} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{v} ×</button>) : <span className="text-xs text-slate-400">None yet</span>}</div><div className="mt-2 flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(input); setInput(""); } }} placeholder={`Add ${group.label.toLowerCase()}`} className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-xs" /><button onClick={() => { add(input); setInput(""); }} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Add</button></div>{input ? <div className="mt-2 flex flex-wrap gap-1">{matches.map(m => <button key={m} onClick={() => { add(m); setInput(""); }} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-100">{m}</button>)}</div> : null}</div>;
}

function QueryCard({ q, selected, onSelect, copy, runGoogle, favorite }: { q: Query; selected: boolean; onSelect: () => void; copy: (text: string) => void; runGoogle: (query: string) => void; favorite: () => void }) {
  return <article onClick={onSelect} className={`cursor-pointer rounded-3xl p-4 shadow ring-1 ${selected ? "bg-indigo-50 ring-indigo-300" : "bg-slate-50 ring-slate-200"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{q.platform}</span><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{q.type}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">Score {q.score}</span><span className={q.launchable ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"}>{q.launchable ? "Launchable X-Ray" : "Copy/paste platform"}</span></div><div className="flex flex-wrap gap-2"><button onClick={e => { e.stopPropagation(); copy(q.query); }} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy</button><button onClick={e => { e.stopPropagation(); runGoogle(q.query); }} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">{q.launchable ? "Run X-Ray" : "Search Google"}</button><button onClick={e => { e.stopPropagation(); favorite(); }} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Favorite</button></div></div><p className="mt-2 text-sm text-slate-500">{q.explanation}</p>{q.warnings.length ? <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900 ring-1 ring-amber-200">{q.warnings.join(" ")}</div> : null}<pre className="query-box mono mt-3 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{q.query}</pre></article>;
}

function LaneCard({ lane, runGoogle, copy }: { lane: Lane; runGoogle: (query: string) => void; copy: (text: string) => void }) {
  return <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-black">{lane.name}</div><p className="mt-1 text-sm text-slate-600">{lane.purpose}</p><div className="mt-2 text-xs text-slate-500">Platform: <b>{lane.platform}</b> · Risk: <b>{lane.risk}</b></div><div className="mt-1 text-xs text-slate-500">{lane.whenToUse}</div></div><div className="flex gap-2"><button onClick={() => copy(lane.query)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy</button><button onClick={() => runGoogle(lane.query)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Run</button></div></div><pre className="query-box mono mt-3 rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">{lane.query}</pre></div>;
}

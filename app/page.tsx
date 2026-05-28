"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "General Technical" | "AI / ML" | "Cybersecurity" | "Cleared / GovCon" | "Healthcare" | "Nursing / Allied" | "Data Engineering" | "Product / Design" | "Sales / GTM";
type CriteriaKey = "titles" | "must" | "nice" | "locations" | "credentials" | "companies" | "filters" | "exclusions";

type Criteria = Record<CriteriaKey, string[]>;
type Query = { id: string; platform: string; type: string; query: string; launchable: boolean; explanation: string; bestFor: string; noiseRisk: string; whenToRun: string; ifBad: string; scores: { coverage: number; precision: number; noiseRisk: number; syntax: number; platformFit: number }; warnings: string[] };
type Lane = { id: string; name: string; purpose: string; platform: string; risk: string; query: string; whenToUse: string };
type SessionEvent = { label: string; detail: string; time: string };
type Feedback = { type: string; mode: Mode; role: string; term?: string; query?: string; time: string };
type Project = { id: string; name: string; mode: Mode; role: string; jd: string; criteria: Criteria | null; time: string };

const modes: Mode[] = ["General Technical", "AI / ML", "Cybersecurity", "Cleared / GovCon", "Healthcare", "Nursing / Allied", "Data Engineering", "Product / Design", "Sales / GTM"];
const emptyCriteria: Criteria = { titles: [], must: [], nice: [], locations: [], credentials: [], companies: [], filters: [], exclusions: [] };

const templates = [
  { name: "Cleared DevSecOps Engineer", mode: "Cleared / GovCon" as Mode, role: "Senior DevSecOps Engineer", jd: "Senior DevSecOps Engineer with active TS/SCI clearance in Washington D.C. metro. Must have AWS GovCloud, Terraform, Kubernetes, Docker, CI/CD, Linux, Python or Bash, Ansible, RMF, ATO, NIST, FedRAMP, and DoD experience. Security+ or CISSP preferred. Target companies include GDIT, Leidos, Booz Allen, CACI, SAIC, Peraton, ManTech." },
  { name: "AI/ML Engineer", mode: "AI / ML" as Mode, role: "Machine Learning Engineer", jd: "Machine Learning Engineer focused on LLM applications, RAG, vector databases, NLP, Python, PyTorch, TensorFlow, MLOps, model evaluation, embeddings, and production ML systems. Remote or San Francisco preferred." },
  { name: "Registered Nurse", mode: "Nursing / Allied" as Mode, role: "Registered Nurse", jd: "Registered Nurse with RN license, BLS, acute care, patient assessment, EMR experience, Epic preferred, hospital setting, Minneapolis or St. Paul area." },
  { name: "Data Engineer", mode: "Data Engineering" as Mode, role: "Data Engineer", jd: "Data Engineer with Snowflake, dbt, Airflow, Python, SQL, Spark, data modeling, ETL, orchestration, cloud data platforms, and analytics engineering experience." },
  { name: "Product Manager", mode: "Product / Design" as Mode, role: "Product Manager", jd: "Product Manager with B2B SaaS, roadmap ownership, discovery, analytics, stakeholder management, user research, product strategy, and technical product experience." }
];

const titleSynonyms: Record<Mode, string[]> = {
  "General Technical": ["Software Engineer", "Systems Engineer", "Platform Engineer", "Application Developer", "Backend Engineer", "Full Stack Engineer"],
  "AI / ML": ["Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer", "NLP Engineer", "Applied Scientist", "Research Engineer"],
  "Cybersecurity": ["Cybersecurity Engineer", "Security Engineer", "Cloud Security Engineer", "AppSec Engineer", "GRC Analyst", "SOC Analyst", "Security Architect"],
  "Cleared / GovCon": ["DevSecOps Engineer", "Platform Engineer", "Cloud Engineer", "Systems Engineer", "Site Reliability Engineer", "Infrastructure Engineer"],
  "Healthcare": ["Healthcare Analyst", "Clinical Analyst", "Epic Analyst", "Healthcare IT Specialist", "Clinical Systems Analyst"],
  "Nursing / Allied": ["Registered Nurse", "RN", "Licensed Practical Nurse", "LPN", "Clinical Nurse", "Nurse Case Manager"],
  "Data Engineering": ["Data Engineer", "Analytics Engineer", "ETL Developer", "Data Platform Engineer", "Data Warehouse Engineer"],
  "Product / Design": ["Product Manager", "Senior Product Manager", "Product Owner", "UX Designer", "Product Designer", "UX Researcher"],
  "Sales / GTM": ["Account Executive", "Sales Development Representative", "Customer Success Manager", "Revenue Operations Manager", "GTM Manager"]
};

const modeSkills: Record<Mode, string[]> = {
  "General Technical": ["JavaScript", "TypeScript", "React", "Node", "Python", "AWS", "Kubernetes", "CI/CD", "APIs", "microservices"],
  "AI / ML": ["Python", "PyTorch", "TensorFlow", "MLOps", "LLM", "RAG", "NLP", "vector database", "embeddings", "model evaluation", "LangChain", "Hugging Face"],
  "Cybersecurity": ["SIEM", "SOC", "AppSec", "cloud security", "IAM", "NIST", "RMF", "FedRAMP", "CISSP", "Security+", "CVE", "threat detection"],
  "Cleared / GovCon": ["AWS GovCloud", "Azure Government", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python", "Bash", "Ansible", "RMF", "ATO", "NIST", "FedRAMP", "DoD", "IC", "GovCon", "SCIF"],
  "Healthcare": ["Epic", "Cerner", "HL7", "FHIR", "HIPAA", "clinical workflows", "EMR", "EHR", "revenue cycle"],
  "Nursing / Allied": ["RN", "BLS", "ACLS", "patient assessment", "acute care", "triage", "Epic", "EMR", "case management"],
  "Data Engineering": ["Snowflake", "dbt", "Airflow", "Python", "SQL", "Spark", "ETL", "data modeling", "Databricks", "Kafka"],
  "Product / Design": ["roadmap", "discovery", "analytics", "Figma", "user research", "B2B SaaS", "stakeholder management", "A/B testing"],
  "Sales / GTM": ["prospecting", "Salesforce", "HubSpot", "enterprise sales", "pipeline", "ARR", "SaaS", "MEDDIC", "RevOps"]
};

const locations = ["Washington D.C. Metro", "Northern Virginia", "Arlington VA", "Reston VA", "Chantilly VA", "Remote", "Minnesota Twin Cities", "Minneapolis", "St. Paul", "Waconia", "San Francisco", "New York", "Austin", "Denver"];
const credentials = ["Secret", "Top Secret", "TS/SCI", "Polygraph", "CI Poly", "Full Scope Poly", "Public Trust", "Security+", "CISSP", "RN", "BLS", "ACLS", "SCIF"];
const companies = ["GDIT", "Leidos", "Booz Allen", "CACI", "SAIC", "Peraton", "ManTech", "Maximus", "Lockheed Martin", "Northrop Grumman", "Raytheon", "Palantir", "Anduril", "Databricks", "OpenAI", "Anthropic"];
const exclusionSeed = ["intern", "student", "help desk", "desktop support", "sales", "recruiter", "training", "bootcamp"];

function unique(items: string[]) { return Array.from(new Set(items.map(x => String(x || "").trim()).filter(Boolean))); }
function quote(term: string) { return /\s|\//.test(term) && !/^".*"$/.test(term) ? `"${term}"` : term; }
function orGroup(items: string[], max = 8) { const clean = unique(items).slice(0, max).map(quote); if (!clean.length) return ""; return clean.length === 1 ? clean[0] : `(${clean.join(" OR ")})`; }
function notGroup(items: string[], google = false) { const clean = unique(items).slice(0, 12); if (!clean.length) return ""; return google ? clean.map(x => `-${quote(x)}`).join(" ") : `NOT (${clean.map(quote).join(" OR ")})`; }
function andJoin(items: string[]) { return items.filter(Boolean).join(" AND "); }
function average(nums: number[]) { return Math.round(nums.reduce((a,b) => a + b, 0) / Math.max(1, nums.length)); }
function nowTime() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

function parseRole(mode: Mode, role: string, jd: string, feedback: Feedback[]): Criteria {
  const text = `${role}\n${jd}`;
  const lower = text.toLowerCase();
  const titles: string[] = [];
  if (/devops|devsecops/i.test(text)) titles.push("DevOps Engineer", "DevSecOps Engineer", "Platform Engineer", "Site Reliability Engineer");
  if (/machine learning|llm|\bml\b|ai engineer/i.test(text)) titles.push("Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer");
  if (/nurse|registered nurse|\brn\b/i.test(text)) titles.push("Registered Nurse", "RN", "Clinical Nurse");
  if (/data engineer|etl|snowflake|dbt/i.test(text)) titles.push("Data Engineer", "Analytics Engineer", "ETL Developer");
  if (/product manager|product owner/i.test(text)) titles.push("Product Manager", "Senior Product Manager", "Product Owner");
  if (/security|cyber|soc|appsec/i.test(text) && mode === "Cybersecurity") titles.push("Security Engineer", "Cybersecurity Engineer", "Cloud Security Engineer");
  if (!titles.length && role.trim()) titles.push(role.trim());
  if (!titles.length) titles.push(...titleSynonyms[mode].slice(0, 3));

  const foundSkills = modeSkills[mode].filter(s => lower.includes(s.toLowerCase()) || lower.includes(s.toLowerCase().replace("+", "")));
  const foundCreds = credentials.filter(s => lower.includes(s.toLowerCase().replace("+", "")) || lower.includes(s.toLowerCase()));
  const foundCompanies = companies.filter(s => lower.includes(s.toLowerCase()));
  const foundLocations: string[] = [];
  if (/washington|\bdc\b|d\.c\.|district of columbia|dmv/i.test(text)) foundLocations.push("Washington D.C. Metro");
  if (/northern virginia|nova|arlington|reston|herndon|chantilly|virginia/i.test(text)) foundLocations.push("Northern Virginia");
  if (/remote/i.test(text)) foundLocations.push("Remote");
  if (/minnesota|minneapolis|st paul|waconia/i.test(text)) foundLocations.push("Minnesota Twin Cities");
  for (const loc of locations) if (lower.includes(loc.toLowerCase())) foundLocations.push(loc);

  const never = feedback.filter(f => f.mode === mode && f.type === "never_suggest" && f.term).map(f => f.term as string);
  const always = feedback.filter(f => f.mode === mode && f.type === "always_include" && f.term).map(f => f.term as string);
  const must = unique([...(foundSkills.length ? foundSkills : modeSkills[mode].slice(0, 5)), ...always]).filter(x => !never.includes(x));
  const nice = modeSkills[mode].filter(s => !must.includes(s)).slice(0, 6).filter(x => !never.includes(x));
  const exclusions = mode === "Cleared / GovCon" ? ["help desk", "desktop support", "intern", "student", "sales", "recruiter"] : exclusionSeed.slice(0, 5);

  return { titles: unique(titles), must, nice, locations: unique(foundLocations), credentials: unique(foundCreds), companies: unique(foundCompanies), filters: unique([...foundLocations, ...foundCreds, ...foundCompanies]), exclusions: unique(exclusions) };
}

function score(query: string, launchable: boolean, c: Criteria, platform: string) {
  const coverage = Math.min(98, 60 + c.titles.length * 5 + c.must.length * 3 + c.credentials.length * 4);
  const precision = Math.min(98, 55 + c.exclusions.length * 3 + c.credentials.length * 4 + (c.companies.length ? 8 : 0));
  const noiseRisk = Math.max(25, 90 - c.exclusions.length * 5 - (c.must.length > 8 ? 12 : 0) - (query.length > 900 ? 10 : 0));
  const syntax = query.includes("(") && (query.match(/\(/g) || []).length !== (query.match(/\)/g) || []).length ? 35 : query.length > 1200 ? 70 : 92;
  const platformFit = platform.includes("ATS") ? 78 : launchable ? 88 : 86;
  return { coverage, precision, noiseRisk, syntax, platformFit };
}

function makeWarnings(query: string, c: Criteria, platform: string) {
  const w: string[] = [];
  if (!c.titles.length) w.push("No title anchor.");
  if (!c.exclusions.length) w.push("No exclusions active.");
  if (c.must.length > 9) w.push("Many must-haves may overconstrain results.");
  if (query.length > 900) w.push("Long query. Consider splitting into lanes.");
  if (platform.includes("ATS") && (query.match(/\(/g) || []).length > 3) w.push("ATS query may be too complex.");
  return w;
}

function buildQueries(c: Criteria): Query[] {
  const titles = orGroup(c.titles, 8);
  const must = orGroup(c.must, 10);
  const nice = orGroup([...c.must, ...c.nice], 14);
  const creds = orGroup(c.credentials, 8);
  const loc = orGroup(c.locations, 6);
  const comp = orGroup(c.companies, 8);
  const nots = notGroup(c.exclusions);
  const googleNots = notGroup(c.exclusions, true);
  const raw = [
    { id: "li-balanced", platform: "LinkedIn Recruiter", type: "Balanced", query: andJoin([titles, must, creds, loc, nots]), launchable: false, bestFor: "First pass", noiseRisk: "Medium", whenToRun: "Run first after criteria approval.", ifBad: "If thin, use Broad. If noisy, use Narrow.", explanation: "Best first pass for recruiter platforms." },
    { id: "li-broad", platform: "LinkedIn Recruiter", type: "Broad", query: andJoin([titles, nice, creds || loc, nots]), launchable: false, bestFor: "More recall", noiseRisk: "Higher", whenToRun: "Use when results are too thin.", ifBad: "Add stronger must-haves or exclusions.", explanation: "Expands into adjacent skills and preferred terms." },
    { id: "li-narrow", platform: "LinkedIn Recruiter", type: "Narrow", query: andJoin([titles, must, creds, comp, loc, nots]), launchable: false, bestFor: "Noise reduction", noiseRisk: "Lower", whenToRun: "Use when balanced search is noisy.", ifBad: "Remove company or location constraints.", explanation: "Adds target companies and tighter requirement logic." },
    { id: "xray-linkedin", platform: "Google X-Ray LinkedIn", type: "X-Ray", query: ["site:linkedin.com/in", titles, must, creds, loc, googleNots].filter(Boolean).join(" "), launchable: true, bestFor: "Public profile discovery", noiseRisk: "Medium", whenToRun: "Use when LinkedIn results are stale or thin.", ifBad: "Add exact title or location phrases.", explanation: "Launchable Google X-Ray for public LinkedIn profile discovery." },
    { id: "xray-github", platform: "GitHub X-Ray", type: "X-Ray", query: ["site:github.com", titles, must, loc, googleNots].filter(Boolean).join(" "), launchable: true, bestFor: "Technical evidence", noiseRisk: "Medium-high", whenToRun: "Use for engineering roles with public repo evidence.", ifBad: "Remove non-technical titles or add repo-specific terms.", explanation: "Use for technical evidence, repos, and open source signals." },
    { id: "xray-resume", platform: "Google X-Ray Resume", type: "X-Ray", query: ["(intitle:resume OR inurl:resume OR filetype:pdf)", titles, must, loc, googleNots].filter(Boolean).join(" "), launchable: true, bestFor: "Public resumes", noiseRisk: "High", whenToRun: "Use as supplement, not primary source.", ifBad: "Add location or exact credential terms.", explanation: "Finds public resume-style pages and PDFs." },
    { id: "ats", platform: "ATS / Avature", type: "Conservative", query: andJoin([titles, orGroup(c.must.slice(0, 5), 5), creds, nots]), launchable: false, bestFor: "Rediscovery", noiseRisk: "Lower", whenToRun: "Use inside ATS or CRM.", ifBad: "Simplify to title plus 2-3 skills.", explanation: "Simpler syntax for ATS or resume database rediscovery." },
    { id: "clearance", platform: "ClearanceJobs / Dice", type: "Clearance Focus", query: andJoin([titles, orGroup(c.credentials, 8), orGroup(c.must.slice(0, 6), 6), loc, nots]), launchable: false, bestFor: "Cleared databases", noiseRisk: "Medium", whenToRun: "Use for cleared or federal contractor roles.", ifBad: "Broaden title variants first.", explanation: "Copy/paste into clearance or technical resume databases. Public mentions do not verify clearance." },
    { id: "target-company", platform: "Google Target Company", type: "X-Ray", query: [titles, must, comp, loc, googleNots].filter(Boolean).join(" "), launchable: true, bestFor: "Competitor/company mapping", noiseRisk: "Medium", whenToRun: "Use when target companies are strong signal.", ifBad: "Add company names or remove overloaded skills.", explanation: "Targets company-name context for market mapping." }
  ];
  return raw.filter(q => q.query.trim()).map(q => ({ ...q, scores: score(q.query, q.launchable, c, q.platform), warnings: makeWarnings(q.query, c, q.platform) }));
}

function buildLanes(c: Criteria): Lane[] {
  return [
    { id: "direct", name: "Direct-fit lane", purpose: "Find profiles matching the literal version of the role.", platform: "LinkedIn Recruiter", risk: "Medium", query: andJoin([orGroup(c.titles), orGroup(c.must.slice(0, 7)), orGroup(c.credentials), notGroup(c.exclusions)]), whenToUse: "Run first when the role is well defined." },
    { id: "adjacent", name: "Adjacent-title lane", purpose: "Catch similar work under different titles.", platform: "LinkedIn Recruiter", risk: "Medium-high noise", query: andJoin([orGroup(unique([...c.titles, ...c.nice]).slice(0, 10)), orGroup(c.must.slice(0, 5)), notGroup(c.exclusions)]), whenToUse: "Use if direct-fit is too small." },
    { id: "xray", name: "Google X-Ray lane", purpose: "Supplement sourcing with public profile discovery.", platform: "Google", risk: "Medium", query: ["site:linkedin.com/in", orGroup(c.titles), orGroup(c.must.slice(0, 7)), notGroup(c.exclusions, true)].filter(Boolean).join(" "), whenToUse: "Use when LinkedIn Recruiter results look stale or thin." },
    { id: "rediscovery", name: "ATS rediscovery lane", purpose: "Search previous applicants or CRM records conservatively.", platform: "ATS / CRM", risk: "Low", query: andJoin([orGroup(c.titles.slice(0, 4)), orGroup(c.must.slice(0, 4)), orGroup(c.credentials.slice(0, 4))]), whenToUse: "Use for Avature, ATS, CRM, or resume database rediscovery." },
    { id: "target", name: "Target-company lane", purpose: "Focus on market maps and competitor talent pools.", platform: "Google / LinkedIn", risk: "Medium", query: andJoin([orGroup(c.titles), orGroup(c.companies), orGroup(c.must.slice(0, 5)), notGroup(c.exclusions)]), whenToUse: "Use when target companies are known and relevant." }
  ];
}

function queryHealth(c: Criteria | null, qs: Query[]) {
  if (!c) return { risk: "Waiting", issues: ["Analyze a role to score query health."], wins: [] as string[] };
  const issues: string[] = [];
  const wins: string[] = [];
  if (!c.titles.length) issues.push("No title anchor."); else wins.push("Title anchors are present.");
  if (c.titles.length === 1) issues.push("Only one title. Add adjacent titles for recall.");
  if (!c.must.length) issues.push("No must-have requirements."); else wins.push("Must-have requirements are present.");
  if (!c.exclusions.length) issues.push("No exclusions. Noise risk is higher."); else wins.push("Exclusions are active.");
  if (c.must.length > 9) issues.push("Too many must-haves. Split into lanes.");
  if (qs.some(q => q.warnings.length)) issues.push("One or more query cards have warnings.");
  return { risk: issues.length > 3 ? "High" : issues.length ? "Medium" : "Low", issues, wins };
}

function buildMemo(role: string, mode: Mode, c: Criteria | null, lanes: Lane[]) {
  if (!c) return "Analyze a role first.";
  return `Search strategy for ${role || "this role"}\n\nMode: ${mode}\n\nStrict market:\n- Titles: ${c.titles.join(", ") || "None"}\n- Must-haves: ${c.must.join(", ") || "None"}\n- Credentials/clearance: ${c.credentials.join(", ") || "None"}\n\nExpanded market:\n- Adjacent titles and terms: ${unique([...c.titles, ...c.nice]).join(", ") || "None"}\n- Locations/filters: ${c.locations.join(", ") || "None"}\n\nRecommended first move:\nRun the direct-fit lane first, then use Broad if results are thin and Narrow if results are noisy. Use Google X-Ray as a supplement when platform results are stale.\n\nLoosen first if needed:\n1. Location\n2. Title variants\n3. Nice-to-have tools\n4. Company target list\n\nExpected false positives:\n${c.exclusions.join(", ") || "None listed"}\n\nVerification checklist:\n- Confirm current location/remote constraints.\n- Confirm must-have depth, not just keyword presence.\n- For cleared roles, treat public clearance language as a breadcrumb only. Manual verification is required.\n\nLanes:\n${lanes.map(l => `- ${l.name}: ${l.whenToUse}`).join("\n")}`;
}

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("Cleared / GovCon");
  const [role, setRole] = useState(templates[0].role);
  const [jd, setJd] = useState(templates[0].jd);
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<Query[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
  const [session, setSession] = useState<SessionEvent[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState("");

  useEffect(() => { try { setFeedback(JSON.parse(localStorage.getItem("booleanos.feedback") || "[]")); setProjects(JSON.parse(localStorage.getItem("booleanos.projects") || "[]")); setFavorites(JSON.parse(localStorage.getItem("booleanos.favorites") || "[]")); setSession(JSON.parse(localStorage.getItem("booleanos.session") || "[]")); } catch {} }, []);
  useEffect(() => { localStorage.setItem("booleanos.feedback", JSON.stringify(feedback)); }, [feedback]);
  useEffect(() => { localStorage.setItem("booleanos.projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("booleanos.favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem("booleanos.session", JSON.stringify(session)); }, [session]);

  const queries = useMemo(() => criteria ? buildQueries(criteria) : [], [criteria]);
  const lanes = useMemo(() => criteria ? buildLanes(criteria) : [], [criteria]);
  const health = useMemo(() => queryHealth(criteria, queries), [criteria, queries]);
  const memo = useMemo(() => buildMemo(role, mode, criteria, lanes), [role, mode, criteria, lanes]);
  const runFirst = queries.find(q => q.id === "li-balanced") || queries[0];
  const xrayQueries = queries.filter(q => q.launchable);
  const workflowStep = !criteria ? 1 : !queries.length ? 2 : !selectedQuery ? 3 : 4;
  const modeFeedback = feedback.filter(f => f.mode === mode);
  const always = unique(modeFeedback.filter(f => f.type === "always_include" && f.term).map(f => f.term as string));
  const never = unique(modeFeedback.filter(f => f.type === "never_suggest" && f.term).map(f => f.term as string));

  function log(label: string, detail: string) { setSession([{ label, detail, time: nowTime() }, ...session].slice(0, 50)); }
  function loadTemplate(index: number) { const t = templates[index]; setMode(t.mode); setRole(t.role); setJd(t.jd); setCriteria(null); setChanges([`Loaded template: ${t.name}`]); log("Template loaded", t.name); }
  function analyzeRole() { const next = parseRole(mode, role, jd, feedback); setCriteria(next); setSelectedQuery(null); setChanges([`Approved ${next.titles.length} title criteria.`, `Approved ${next.must.length} must-have criteria.`, always.length ? `Memory added always-include terms: ${always.join(", ")}.` : "No always-include memory terms yet.", never.length ? `Memory removed never-suggest terms: ${never.join(", ")}.` : "No never-suggest terms yet."]); log("Role analyzed", role); }
  function addCriteria(key: CriteriaKey, value: string) { if (!criteria || !value.trim()) return; setCriteria({ ...criteria, [key]: unique([...criteria[key], value]) }); log("Criteria added", `${key}: ${value}`); }
  function removeCriteria(key: CriteriaKey, value: string) { if (!criteria) return; setCriteria({ ...criteria, [key]: criteria[key].filter(x => x !== value) }); log("Criteria removed", `${key}: ${value}`); }
  function moveTerm(from: CriteriaKey, to: CriteriaKey, value: string) { if (!criteria) return; const next = { ...criteria, [from]: criteria[from].filter(x => x !== value), [to]: unique([...criteria[to], value]) }; setCriteria(next); setChanges([`Moved ${value} from ${from} to ${to}.`, ...changes].slice(0, 12)); log("Criteria moved", `${value}: ${from} → ${to}`); }
  function clearCriteria() { setCriteria(emptyCriteria); setChanges(["Cleared all search criteria.", ...changes].slice(0, 12)); log("Criteria cleared", role); }
  function saveFeedback(type: string, term?: string) { const item: Feedback = { type, mode, role, query: selectedQuery?.query, term, time: new Date().toISOString() }; setFeedback([item, ...feedback].slice(0, 100)); setChanges([`Feedback saved: ${type}${term ? ` (${term})` : ""}.`, ...changes].slice(0, 12)); log("Feedback saved", type); }
  function saveProject() { const item: Project = { id: `${Date.now()}`, name: role || "Untitled project", mode, role, jd, criteria, time: new Date().toISOString() }; setProjects([item, ...projects].slice(0, 25)); setChanges([`Saved project: ${item.name}.`, ...changes].slice(0, 12)); log("Project saved", item.name); }
  function loadProject(p: Project) { setMode(p.mode); setRole(p.role); setJd(p.jd); setCriteria(p.criteria); setChanges([`Reloaded project: ${p.name}.`, ...changes].slice(0, 12)); log("Project reloaded", p.name); }
  function favoriteQuery(q: Query) { setFavorites([q, ...favorites.filter(x => x.query !== q.query)].slice(0, 25)); log("Query favorited", `${q.platform} ${q.type}`); }
  function copy(text: string) { navigator.clipboard.writeText(text); log("Copied", text.slice(0, 60)); }
  function runGoogle(query: string) { window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer"); log("Search launched", query.slice(0, 80)); }
  function runAllXray() { if (!xrayQueries.length) return; if (window.confirm(`Open ${xrayQueries.length} X-Ray searches?`)) xrayQueries.slice(0, 5).forEach((q, i) => setTimeout(() => runGoogle(q.query), i * 350)); }
  function copyGoogleUrl(query: string) { copy(`https://www.google.com/search?q=${encodeURIComponent(query)}`); }
  function exportPlan() { const text = `# BooleanOS Search Plan\n\nRole: ${role}\nMode: ${mode}\n\n## Criteria\n${JSON.stringify(criteria, null, 2)}\n\n## Run First\n${runFirst?.platform || "None"} ${runFirst?.type || ""}\n${runFirst?.query || ""}\n\n## Lanes\n${lanes.map(l => `### ${l.name}\n${l.purpose}\n${l.query}`).join("\n\n")}\n\n## HM Memo\n${memo}`; downloadFile("booleanos-search-plan.md", text); log("Plan exported", role); }
  function exportSourcingOS() { const payload = { type: "booleanos.search_strategy", version: "2.2", role, mode, criteria, runFirst, lanes, humanApproved: true, noScraping: true, noAutoOutreach: true, exportedAt: new Date().toISOString() }; downloadFile("booleanos-sourcingos-export.json", JSON.stringify(payload, null, 2)); log("SourcingOS export", role); }
  function joinWaitlist() { if (!waitlistEmail.includes("@")) { setWaitlistStatus("Enter a valid email first."); return; } const list = JSON.parse(localStorage.getItem("booleanos.waitlist") || "[]"); localStorage.setItem("booleanos.waitlist", JSON.stringify(unique([waitlistEmail, ...list]))); setWaitlistStatus("Saved to local beta waitlist. Connect Supabase later for cloud capture."); }

  return <main className="mx-auto max-w-7xl p-4">
    <header className="mb-5 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-200">BooleanOS v2.2 Live UX + Workflow Hardening</div><h1 className="mt-3 text-4xl font-black tracking-tight">AI Sourcing Query Copilot</h1><p className="mt-2 max-w-3xl text-slate-600">Turn messy intake into guided workflow, editable search criteria, scored Boolean/X-Ray searches, search lanes, HM memos, local learning, and SourcingOS-ready exports.</p></div><div className="flex flex-wrap gap-2"><button onClick={saveProject} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Save Project</button><button onClick={exportPlan} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Export Plan</button><button onClick={exportSourcingOS} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">SourcingOS Export</button></div></div>
    </header>

    <WorkflowBar step={workflowStep} />

    <section className="mt-4 grid gap-4 lg:grid-cols-[390px_1fr_340px]">
      <aside className="space-y-4"><Panel title="1. Intake"><label className="block text-xs font-black uppercase text-slate-500">Template</label><select onChange={e => loadTemplate(Number(e.target.value))} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm font-bold" defaultValue="0">{templates.map((t, i) => <option key={t.name} value={i}>{t.name}</option>)}</select><label className="mt-4 block text-xs font-black uppercase text-slate-500">Mode</label><select value={mode} onChange={e => setMode(e.target.value as Mode)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm font-bold">{modes.map(m => <option key={m}>{m}</option>)}</select><label className="mt-4 block text-xs font-black uppercase text-slate-500">Role title</label><input value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm"/><label className="mt-4 block text-xs font-black uppercase text-slate-500">JD / notes</label><textarea value={jd} onChange={e => setJd(e.target.value)} className="mt-1 h-64 w-full rounded-2xl border border-slate-300 p-3 text-sm"/><button onClick={analyzeRole} className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">Analyze Role</button></Panel><Panel title="2. Active Search Criteria">{criteria ? <><div className="mb-3 flex flex-wrap gap-2"><button onClick={analyzeRole} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Accept all</button><button onClick={clearCriteria} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Clear all</button></div><CriteriaEditor criteria={criteria} addCriteria={addCriteria} removeCriteria={removeCriteria} moveTerm={moveTerm} mode={mode}/></> : <p className="text-sm text-slate-500">Analyze a role to activate editable search criteria.</p>}</Panel></aside>

      <section className="space-y-4"><Panel title="AI Suggested Strategy Review">{!criteria ? <p className="text-sm text-slate-500">Click Analyze Role to generate search criteria.</p> : <div className="grid gap-3 md:grid-cols-3"><DecisionCard title="Use in search" items={[...criteria.titles, ...criteria.must, ...criteria.credentials]} tone="indigo"/><DecisionCard title="Use as filters / context" items={[...criteria.locations, ...criteria.companies, ...criteria.filters]} tone="amber"/><DecisionCard title="Avoid / exclude" items={criteria.exclusions} tone="rose"/></div>}</Panel><Panel title="Query Health"> <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${health.risk === "Low" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : health.risk === "High" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>Risk: {health.risk}</span>{runFirst ? <button onClick={() => runGoogle(runFirst.query)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Run First</button> : null}</div><div className="mt-4 grid gap-3 md:grid-cols-2"><MiniList title="Issues" items={health.issues}/><MiniList title="What looks good" items={health.wins}/></div></Panel><Panel title="Run First Recommendation">{runFirst ? <div><p className="text-sm text-slate-600">Start with <b>{runFirst.platform} · {runFirst.type}</b>. If results are thin, use Broad. If results are noisy, use Narrow. If LinkedIn is weak, run Google X-Ray.</p><ScoreGrid q={runFirst}/><pre className="query-box mono mt-3 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{runFirst.query}</pre></div> : <p className="text-sm text-slate-500">Analyze a role first.</p>}</Panel><Panel title="Search Lanes"><div className="grid gap-3">{lanes.length ? lanes.map(lane => <LaneCard key={lane.id} lane={lane} runGoogle={runGoogle} copy={copy}/>) : <p className="text-sm text-slate-500">No lanes yet.</p>}</div></Panel><Panel title="Generated Queries"><div className="mb-4 flex flex-wrap gap-2"><button onClick={runAllXray} className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">Run All X-Ray</button>{runFirst ? <button onClick={() => copyGoogleUrl(runFirst.query)} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Copy Google URL</button> : null}</div><div className="space-y-4">{queries.length ? queries.map(q => <QueryCard key={q.id} q={q} selected={selectedQuery?.id === q.id} onSelect={() => setSelectedQuery(q)} copy={copy} runGoogle={runGoogle} favorite={() => favoriteQuery(q)} copyGoogleUrl={copyGoogleUrl}/>) : <p className="text-sm text-slate-500">No queries yet.</p>}</div></Panel></section>

      <aside className="space-y-4"><Panel title="3. Optimize and Learn"><div className="grid gap-2"><button onClick={() => saveFeedback("worked")} className="rounded-2xl bg-emerald-50 px-3 py-2 text-left text-sm font-black text-emerald-700 ring-1 ring-emerald-200">Worked well</button><button onClick={() => saveFeedback("too_broad")} className="rounded-2xl bg-amber-50 px-3 py-2 text-left text-sm font-black text-amber-700 ring-1 ring-amber-200">Too broad</button><button onClick={() => saveFeedback("too_narrow")} className="rounded-2xl bg-rose-50 px-3 py-2 text-left text-sm font-black text-rose-700 ring-1 ring-rose-200">Too narrow</button><button onClick={() => saveFeedback("always_include", criteria?.must[0] || criteria?.credentials[0] || "")} className="rounded-2xl bg-indigo-50 px-3 py-2 text-left text-sm font-black text-indigo-700 ring-1 ring-indigo-200">Always include top term</button><button onClick={() => saveFeedback("never_suggest", criteria?.exclusions[0] || "noise")} className="rounded-2xl bg-slate-100 px-3 py-2 text-left text-sm font-black text-slate-700 ring-1 ring-slate-200">Never suggest top exclusion</button></div></Panel><Panel title="What Changed Because of Feedback"><MiniList title="Recent changes" items={changes.length ? changes : ["No feedback-driven changes yet."]}/></Panel><Panel title="Local Learning"><div className="space-y-2 text-sm text-slate-700"><p><b>{modeFeedback.length}</b> feedback events for {mode}</p><p>Always include: {always.join(", ") || "None yet"}</p><p>Never suggest: {never.join(", ") || "None yet"}</p></div></Panel><Panel title="HM Memo"><pre className="query-box max-h-80 overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">{memo}</pre><button onClick={() => copy(memo)} className="mt-3 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy memo</button></Panel><Panel title="Search Session History"><SavedList items={session.map(s => `${s.time} · ${s.label}: ${s.detail}`)} empty="No session history yet."/></Panel><Panel title="Hosted Beta Gate"><p className="text-sm text-slate-500">Local waitlist now. Supabase/Stripe can be connected later.</p><input value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="email@example.com" className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2 text-xs"/><button onClick={joinWaitlist} className="mt-2 rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">Join Waitlist</button>{waitlistStatus ? <p className="mt-2 text-xs font-bold text-slate-600">{waitlistStatus}</p> : null}</Panel><Panel title="Saved Projects"><div className="space-y-2">{projects.length ? projects.slice(0, 6).map(p => <button key={p.id} onClick={() => loadProject(p)} className="w-full rounded-2xl bg-slate-50 p-3 text-left text-xs font-bold text-slate-700 ring-1 ring-slate-200">{p.name} · {p.mode}<span className="block text-slate-400">Click to reload</span></button>) : <p className="text-sm text-slate-500">No projects saved yet.</p>}</div></Panel><Panel title="Favorite Queries"><SavedList items={favorites.map(f => `${f.platform} · ${f.type}`)} empty="No favorites yet."/></Panel></aside>
    </section>
  </main>;
}

function WorkflowBar({ step }: { step: number }) { const steps = ["Paste JD", "Analyze Role", "Review Criteria", "Run First Search", "Save / Export"]; return <section className="rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-white"><div className="grid gap-2 md:grid-cols-5">{steps.map((s, i) => <div key={s} className={`rounded-2xl p-3 text-center text-xs font-black ring-1 ${i + 1 <= step ? "bg-indigo-50 text-indigo-700 ring-indigo-200" : "bg-slate-50 text-slate-400 ring-slate-200"}`}>{i + 1}. {s}</div>)}</div></section>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white"><h2 className="mb-3 text-xl font-black">{title}</h2>{children}</section>; }
function DecisionCard({ title, items, tone }: { title: string; items: string[]; tone: "indigo" | "amber" | "rose" }) { const toneClass = tone === "indigo" ? "bg-indigo-50 text-indigo-900 ring-indigo-100" : tone === "amber" ? "bg-amber-50 text-amber-900 ring-amber-100" : "bg-rose-50 text-rose-900 ring-rose-100"; return <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}><div className="mb-2 text-xs font-black uppercase tracking-wide opacity-70">{title}</div><div className="flex flex-wrap gap-2">{items.length ? unique(items).map(item => <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-black ring-1 ring-white">{item}</span>) : <span className="text-sm opacity-70">None yet.</span>}</div></div>; }
function MiniList({ title, items }: { title: string; items: string[] }) { return <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><div className="mb-2 text-xs font-black uppercase text-slate-500">{title}</div>{items.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul> : <p className="text-sm text-slate-500">None.</p>}</div>; }
function SavedList({ items, empty }: { items: string[]; empty: string }) { return <div className="space-y-2">{items.length ? items.slice(0, 8).map((item, idx) => <div key={idx} className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{item}</div>) : <p className="text-sm text-slate-500">{empty}</p>}</div>; }
function CriteriaEditor({ criteria, addCriteria, removeCriteria, moveTerm, mode }: { criteria: Criteria; addCriteria: (key: CriteriaKey, value: string) => void; removeCriteria: (key: CriteriaKey, value: string) => void; moveTerm: (from: CriteriaKey, to: CriteriaKey, value: string) => void; mode: Mode }) { const groups: { key: CriteriaKey; label: string; suggestions: string[] }[] = [{ key: "titles", label: "Target titles", suggestions: titleSynonyms[mode] }, { key: "must", label: "Must-haves", suggestions: modeSkills[mode] }, { key: "nice", label: "Preferred terms", suggestions: modeSkills[mode] }, { key: "locations", label: "Locations", suggestions: locations }, { key: "credentials", label: "Credentials / clearance", suggestions: credentials }, { key: "companies", label: "Target companies", suggestions: companies }, { key: "filters", label: "Filters / context", suggestions: [...locations, ...companies, ...credentials] }, { key: "exclusions", label: "Exclusions", suggestions: exclusionSeed }]; return <div className="space-y-3">{groups.map(g => <CriteriaGroup key={g.key} group={g} values={criteria[g.key]} add={v => addCriteria(g.key, v)} remove={v => removeCriteria(g.key, v)} move={(to, v) => moveTerm(g.key, to, v)}/>)}</div>; }
function CriteriaGroup({ group, values, add, remove, move }: { group: { key: CriteriaKey; label: string; suggestions: string[] }; values: string[]; add: (value: string) => void; remove: (value: string) => void; move: (to: CriteriaKey, value: string) => void }) { const [input, setInput] = useState(""); const matches = group.suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)).slice(0, 5); return <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">{group.label}</div><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map(v => <span key={v} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200"><button onClick={() => remove(v)}>{v} ×</button>{group.key !== "exclusions" ? <button onClick={() => move("exclusions", v)} className="text-rose-600">exclude</button> : null}{group.key !== "filters" ? <button onClick={() => move("filters", v)} className="text-amber-600">filter</button> : null}</span>) : <span className="text-xs text-slate-400">None yet</span>}</div><div className="mt-2 flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(input); setInput(""); } }} placeholder={`Add ${group.label.toLowerCase()}`} className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-xs"/><button onClick={() => { add(input); setInput(""); }} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Add</button></div>{input ? <div className="mt-2 flex flex-wrap gap-1">{matches.map(m => <button key={m} onClick={() => { add(m); setInput(""); }} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-100">{m}</button>)}</div> : null}</div>; }
function ScoreGrid({ q }: { q: Query }) { const items = [["Coverage", q.scores.coverage], ["Precision", q.scores.precision], ["Noise", q.scores.noiseRisk], ["Syntax", q.scores.syntax], ["Platform", q.scores.platformFit]] as const; return <div className="mt-3 grid gap-2 md:grid-cols-5">{items.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"><div className="text-[10px] font-black uppercase text-slate-500">{label}</div><div className="text-lg font-black text-slate-900">{value}</div></div>)}</div>; }
function QueryCard({ q, selected, onSelect, copy, runGoogle, favorite, copyGoogleUrl }: { q: Query; selected: boolean; onSelect: () => void; copy: (text: string) => void; runGoogle: (query: string) => void; favorite: () => void; copyGoogleUrl: (query: string) => void }) { const overall = average(Object.values(q.scores)); return <article onClick={onSelect} className={`cursor-pointer rounded-3xl p-4 shadow ring-1 ${selected ? "bg-indigo-50 ring-indigo-300" : "bg-slate-50 ring-slate-200"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{q.platform}</span><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{q.type}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">Overall {overall}</span><span className={q.launchable ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"}>{q.launchable ? "Launchable X-Ray" : "Copy/paste platform"}</span></div><div className="flex flex-wrap gap-2"><button onClick={e => { e.stopPropagation(); copy(q.query); }} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy</button><button onClick={e => { e.stopPropagation(); runGoogle(q.query); }} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">{q.launchable ? "Run X-Ray" : "Search Google"}</button><button onClick={e => { e.stopPropagation(); copyGoogleUrl(q.query); }} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Copy URL</button><button onClick={e => { e.stopPropagation(); favorite(); }} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Favorite</button></div></div><p className="mt-2 text-sm text-slate-500">{q.explanation}</p><div className="mt-3 grid gap-2 md:grid-cols-4"><MiniFact label="Best for" value={q.bestFor}/><MiniFact label="Noise risk" value={q.noiseRisk}/><MiniFact label="When to run" value={q.whenToRun}/><MiniFact label="If bad" value={q.ifBad}/></div><ScoreGrid q={q}/>{q.warnings.length ? <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900 ring-1 ring-amber-200">{q.warnings.join(" ")}</div> : null}<pre className="query-box mono mt-3 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{q.query}</pre></article>; }
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"><div className="text-[10px] font-black uppercase text-slate-400">{label}</div><div className="mt-1 text-xs font-bold text-slate-700">{value}</div></div>; }
function LaneCard({ lane, runGoogle, copy }: { lane: Lane; runGoogle: (query: string) => void; copy: (text: string) => void }) { return <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-black">{lane.name}</div><p className="mt-1 text-sm text-slate-600">{lane.purpose}</p><div className="mt-2 text-xs text-slate-500">Platform: <b>{lane.platform}</b> · Risk: <b>{lane.risk}</b></div><div className="mt-1 text-xs text-slate-500">{lane.whenToUse}</div></div><div className="flex gap-2"><button onClick={() => copy(lane.query)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy</button><button onClick={() => runGoogle(lane.query)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Run</button></div></div><pre className="query-box mono mt-3 rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">{lane.query}</pre></div>; }

"use client";

import { useMemo, useState } from "react";

type Mode = "General Technical" | "AI / ML" | "Cybersecurity" | "Cleared / GovCon" | "Healthcare" | "Nursing / Allied" | "Data Engineering" | "Product / Design" | "Sales / GTM";

type Criteria = {
  titles: string[];
  must: string[];
  nice: string[];
  locations: string[];
  credentials: string[];
  exclusions: string[];
};

const modes: Mode[] = ["General Technical", "AI / ML", "Cybersecurity", "Cleared / GovCon", "Healthcare", "Nursing / Allied", "Data Engineering", "Product / Design", "Sales / GTM"];

const demo = `Senior DevOps Engineer with active TS/SCI clearance. Washington D.C. metro area. Must have AWS GovCloud, Terraform, Kubernetes, Docker, CI/CD, Linux, Python or Bash, Ansible, RMF, ATO, NIST, FedRAMP, and DoD experience. Security+ preferred.`;

function unique(items: string[]) {
  return Array.from(new Set(items.map(x => x.trim()).filter(Boolean)));
}

function quote(term: string) {
  return /\s|\//.test(term) ? `"${term}"` : term;
}

function orGroup(items: string[], max = 8) {
  const clean = unique(items).slice(0, max).map(quote);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  return `(${clean.join(" OR ")})`;
}

function notGroup(items: string[], google = false) {
  const clean = unique(items).slice(0, 10);
  if (!clean.length) return "";
  if (google) return clean.map(x => `-${quote(x)}`).join(" ");
  return `NOT (${clean.map(quote).join(" OR ")})`;
}

function andJoin(items: string[]) {
  return items.filter(Boolean).join(" AND ");
}

function analyze(mode: Mode, jd: string): Criteria {
  const lower = jd.toLowerCase();
  const titles: string[] = [];
  if (/devops|devsecops/i.test(jd)) titles.push("DevOps Engineer", "DevSecOps Engineer", "Platform Engineer", "Site Reliability Engineer");
  if (/machine learning|llm|\bml\b|ai engineer/i.test(jd)) titles.push("Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer");
  if (/nurse|registered nurse|\brn\b/i.test(jd)) titles.push("Registered Nurse", "RN");
  if (/product manager/i.test(jd)) titles.push("Product Manager", "Senior Product Manager", "Product Owner");
  if (!titles.length) titles.push(mode === "Cleared / GovCon" ? "Systems Engineer" : "Target Role");

  const skillBank = ["AWS GovCloud", "Azure Government", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python", "Bash", "Ansible", "RMF", "ATO", "NIST", "FedRAMP", "DoD", "IC", "GovCon", "MLOps", "PyTorch", "TensorFlow", "RAG", "LLM", "NLP", "Snowflake", "dbt", "Airflow", "Epic", "HIPAA"];
  const must = skillBank.filter(s => lower.includes(s.toLowerCase()));
  const credentials = ["TS/SCI", "Top Secret", "Secret", "Public Trust", "Polygraph", "Security+", "CISSP", "RN", "BLS"].filter(s => lower.includes(s.toLowerCase().replace("+", "")) || lower.includes(s.toLowerCase()));
  const locations: string[] = [];
  if (/washington|\bdc\b|d\.c\.|district of columbia|dmv/i.test(jd)) locations.push("Washington D.C. Metro");
  if (/northern virginia|nova|arlington|reston|herndon|chantilly/i.test(jd)) locations.push("Northern Virginia");
  if (/remote/i.test(jd)) locations.push("Remote");
  if (/minnesota|minneapolis|st paul|waconia/i.test(jd)) locations.push("Minnesota Twin Cities");
  const exclusions = mode === "Cleared / GovCon" ? ["help desk", "desktop support", "intern", "student", "sales"] : ["intern", "student", "sales", "recruiter"];
  return { titles: unique(titles), must: unique(must), nice: [], locations: unique(locations), credentials: unique(credentials), exclusions };
}

function buildQueries(criteria: Criteria) {
  const titles = orGroup(criteria.titles, 8);
  const must = orGroup(criteria.must, 10);
  const creds = orGroup(criteria.credentials, 8);
  const loc = orGroup(criteria.locations, 6);
  const exclusions = notGroup(criteria.exclusions);
  const googleExclusions = notGroup(criteria.exclusions, true);
  return [
    { platform: "LinkedIn Recruiter", type: "Balanced", query: andJoin([titles, must, creds, loc, exclusions]), launchable: false },
    { platform: "LinkedIn Recruiter", type: "Broad", query: andJoin([titles, orGroup([...criteria.must, ...criteria.nice], 14), creds || loc, exclusions]), launchable: false },
    { platform: "Google X-Ray LinkedIn", type: "X-Ray", query: ["site:linkedin.com/in", titles, must, creds, loc, googleExclusions].filter(Boolean).join(" "), launchable: true },
    { platform: "GitHub X-Ray", type: "X-Ray", query: ["site:github.com", titles, must, loc, googleExclusions].filter(Boolean).join(" "), launchable: true },
    { platform: "ATS / Avature", type: "Conservative", query: andJoin([titles, must, creds, exclusions]), launchable: false }
  ];
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("Cleared / GovCon");
  const [jd, setJd] = useState(demo);
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const queries = useMemo(() => criteria ? buildQueries(criteria) : [], [criteria]);

  function runAnalyze() {
    setCriteria(analyze(mode, jd));
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function runGoogle(query: string) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto max-w-7xl p-4">
      <header className="mb-5 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-white">
        <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-200">BooleanOS Live Beta</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight">AI Sourcing Query Copilot</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Turn messy role intake into approved search criteria, sourcing lanes, Boolean strings, Google X-Ray searches, and recruiter-ready search strategy.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white">
          <h2 className="text-xl font-black">1. Intake</h2>
          <label className="mt-4 block text-xs font-black uppercase text-slate-500">Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value as Mode)} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm font-bold">
            {modes.map(m => <option key={m}>{m}</option>)}
          </select>
          <label className="mt-4 block text-xs font-black uppercase text-slate-500">JD / notes</label>
          <textarea value={jd} onChange={e => setJd(e.target.value)} className="mt-1 h-72 w-full rounded-2xl border border-slate-300 p-3 text-sm" />
          <button onClick={runAnalyze} className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">Analyze Role</button>
        </aside>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white">
            <h2 className="text-xl font-black">AI Suggested Strategy Review</h2>
            {!criteria ? <p className="mt-2 text-sm text-slate-500">Click Analyze Role to generate search criteria.</p> : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Card title="Use in search" items={[...criteria.titles, ...criteria.must, ...criteria.credentials]} tone="indigo" />
                <Card title="Use as filters / context" items={criteria.locations} tone="amber" />
                <Card title="Avoid / exclude" items={criteria.exclusions} tone="rose" />
              </div>
            )}
          </div>

          {criteria ? <div className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white">
            <h2 className="text-xl font-black">Run First Recommendation</h2>
            <p className="mt-2 text-sm text-slate-600">Start with LinkedIn Recruiter Balanced. If results are thin, use Broad. If LinkedIn is weak, run Google X-Ray.</p>
          </div> : null}

          <div className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-white">
            <h2 className="text-xl font-black">Generated Queries</h2>
            <div className="mt-4 space-y-4">
              {queries.length ? queries.map((q, idx) => (
                <article key={idx} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{q.platform}</span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{q.type}</span>
                      <span className={q.launchable ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"}>{q.launchable ? "Launchable X-Ray" : "Copy/paste platform"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copy(q.query)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy</button>
                      <button onClick={() => runGoogle(q.query)} className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">{q.launchable ? "Run X-Ray" : "Search Google"}</button>
                    </div>
                  </div>
                  <pre className="query-box mono mt-3 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{q.query}</pre>
                </article>
              )) : <p className="text-sm text-slate-500">No queries yet.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Card({ title, items, tone }: { title: string; items: string[]; tone: "indigo" | "amber" | "rose" }) {
  const toneClass = tone === "indigo" ? "bg-indigo-50 text-indigo-900 ring-indigo-100" : tone === "amber" ? "bg-amber-50 text-amber-900 ring-amber-100" : "bg-rose-50 text-rose-900 ring-rose-100";
  return <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}>
    <div className="mb-2 text-xs font-black uppercase tracking-wide opacity-70">{title}</div>
    <div className="flex flex-wrap gap-2">
      {items.length ? unique(items).map(item => <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-black ring-1 ring-white">{item}</span>) : <span className="text-sm opacity-70">None yet.</span>}
    </div>
  </div>;
}

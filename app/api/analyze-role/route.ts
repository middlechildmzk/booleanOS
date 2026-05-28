import { NextRequest, NextResponse } from "next/server";

type Mode = "General Technical" | "AI / ML" | "Cybersecurity" | "Cleared / GovCon" | "Healthcare" | "Nursing / Allied" | "Data Engineering" | "Product / Design" | "Sales / GTM";

type Criteria = {
  titles: string[];
  must: string[];
  nice: string[];
  locations: string[];
  credentials: string[];
  companies: string[];
  filters: string[];
  exclusions: string[];
};

const fallbackByMode: Record<Mode, Criteria> = {
  "General Technical": { titles: ["Software Engineer", "Systems Engineer"], must: ["JavaScript", "TypeScript", "React", "Node", "AWS"], nice: ["Kubernetes", "CI/CD"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "AI / ML": { titles: ["Machine Learning Engineer", "AI Engineer", "LLM Engineer", "MLOps Engineer"], must: ["Python", "PyTorch", "TensorFlow", "MLOps", "LLM", "RAG"], nice: ["NLP", "vector database", "embeddings"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Cybersecurity": { titles: ["Security Engineer", "Cybersecurity Engineer", "Cloud Security Engineer"], must: ["SIEM", "SOC", "AppSec", "cloud security", "NIST"], nice: ["RMF", "FedRAMP", "CISSP"], locations: [], credentials: ["Security+", "CISSP"], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Cleared / GovCon": { titles: ["DevSecOps Engineer", "Platform Engineer", "Cloud Engineer", "Systems Engineer", "Site Reliability Engineer"], must: ["AWS GovCloud", "Terraform", "Kubernetes", "Linux", "RMF", "ATO", "NIST", "FedRAMP", "DoD"], nice: ["Docker", "Ansible", "CI/CD", "SCIF"], locations: ["Washington D.C. Metro"], credentials: ["TS/SCI", "Top Secret", "Security+"], companies: ["GDIT", "Leidos", "Booz Allen", "CACI", "SAIC"], filters: ["Washington D.C. Metro", "TS/SCI"], exclusions: ["help desk", "desktop support", "intern", "student", "sales", "recruiter"] },
  "Healthcare": { titles: ["Healthcare Analyst", "Clinical Analyst", "Epic Analyst"], must: ["Epic", "Cerner", "HL7", "FHIR", "HIPAA"], nice: ["clinical workflows", "EMR", "EHR"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Nursing / Allied": { titles: ["Registered Nurse", "RN", "Clinical Nurse"], must: ["RN", "BLS", "patient assessment", "acute care", "Epic"], nice: ["ACLS", "triage", "EMR"], locations: [], credentials: ["RN", "BLS"], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Data Engineering": { titles: ["Data Engineer", "Analytics Engineer", "ETL Developer"], must: ["Snowflake", "dbt", "Airflow", "Python", "SQL"], nice: ["Spark", "Databricks", "Kafka"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Product / Design": { titles: ["Product Manager", "Senior Product Manager", "Product Owner"], must: ["roadmap", "discovery", "analytics", "B2B SaaS"], nice: ["Figma", "user research", "A/B testing"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "sales", "recruiter"] },
  "Sales / GTM": { titles: ["Account Executive", "Customer Success Manager", "Revenue Operations Manager"], must: ["prospecting", "Salesforce", "enterprise sales", "pipeline", "SaaS"], nice: ["HubSpot", "MEDDIC", "ARR"], locations: [], credentials: [], companies: [], filters: [], exclusions: ["intern", "student", "recruiter"] }
};

function unique(items: string[]) {
  return Array.from(new Set((items || []).map(x => String(x || "").trim()).filter(Boolean)));
}

function normalizeCriteria(raw: Partial<Criteria>, mode: Mode): Criteria {
  const fallback = fallbackByMode[mode] || fallbackByMode["General Technical"];
  return {
    titles: unique(raw.titles?.length ? raw.titles : fallback.titles).slice(0, 12),
    must: unique(raw.must?.length ? raw.must : fallback.must).slice(0, 14),
    nice: unique(raw.nice?.length ? raw.nice : fallback.nice).slice(0, 14),
    locations: unique(raw.locations || fallback.locations).slice(0, 10),
    credentials: unique(raw.credentials || fallback.credentials).slice(0, 10),
    companies: unique(raw.companies || fallback.companies).slice(0, 12),
    filters: unique(raw.filters || fallback.filters).slice(0, 14),
    exclusions: unique(raw.exclusions?.length ? raw.exclusions : fallback.exclusions).slice(0, 14)
  };
}

function localFallback(mode: Mode, role: string, jd: string): Criteria {
  const base = normalizeCriteria({}, mode);
  const text = `${role}\n${jd}`.toLowerCase();
  if (/remote/.test(text)) base.locations = unique([...base.locations, "Remote"]);
  if (/washington|\bdc\b|d\.c\.|district of columbia|dmv/.test(text)) base.locations = unique([...base.locations, "Washington D.C. Metro"]);
  if (/northern virginia|nova|arlington|reston|herndon|chantilly/.test(text)) base.locations = unique([...base.locations, "Northern Virginia"]);
  if (/minneapolis|st paul|minnesota|waconia/.test(text)) base.locations = unique([...base.locations, "Minnesota Twin Cities"]);
  return base;
}

async function callOpenAI(mode: Mode, role: string, jd: string, memory: unknown) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) return null;

  const system = `You are BooleanOS, an expert recruiter sourcing query strategist. Extract search criteria from job descriptions. Return ONLY valid JSON with this exact shape: {"titles": string[], "must": string[], "nice": string[], "locations": string[], "credentials": string[], "companies": string[], "filters": string[], "exclusions": string[], "strategyNotes": string[], "memoryChanges": string[]}.
Rules: Do not use protected traits. Do not claim public text verifies clearance. For cleared/GovCon, clearance is a search breadcrumb only. Keep output concise and recruiter-native.`;

  const input = `Mode: ${mode}\nRole: ${role}\nJD / Notes:\n${jd}\n\nLocal memory / feedback:\n${JSON.stringify(memory || {}, null, 2)}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: input }
      ],
      text: { format: { type: "json_object" } }
    })
  });

  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "{}";
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = (body.mode || "General Technical") as Mode;
    const role = String(body.role || "");
    const jd = String(body.jd || "");
    const memory = body.memory || {};

    let source = "local-fallback";
    let raw: any = null;

    try {
      raw = await callOpenAI(mode, role, jd, memory);
      if (raw) source = "openai";
    } catch (error) {
      raw = null;
    }

    const criteria = raw ? normalizeCriteria(raw, mode) : localFallback(mode, role, jd);
    const strategyNotes = raw?.strategyNotes || ["AI API not configured or unavailable. Used safe deterministic BooleanOS parser."];
    const memoryChanges = raw?.memoryChanges || [];

    return NextResponse.json({ ok: true, source, criteria, strategyNotes, memoryChanges });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

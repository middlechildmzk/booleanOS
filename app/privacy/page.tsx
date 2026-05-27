export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-3xl bg-white/95 p-8 shadow-xl ring-1 ring-white">
        <h1 className="text-4xl font-black tracking-tight">Privacy</h1>
        <p className="mt-4 text-slate-600">BooleanOS helps recruiters create search strategy from text they provide.</p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>It analyzes job descriptions and intake notes.</li>
          <li>It suggests search criteria, exclusions, and sourcing lanes.</li>
          <li>It generates Boolean and X-Ray search strings.</li>
          <li>It does not collect candidates or send outreach.</li>
        </ul>
      </section>
    </main>
  );
}

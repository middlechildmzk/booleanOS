import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="rounded-3xl bg-white/95 p-10 shadow-xl ring-1 ring-white">
        <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-200">BooleanOS</div>
        <h1 className="mt-5 text-5xl font-black tracking-tight">The AI search strategy copilot for sourcers.</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600">Turn messy role intake into search criteria, sourcing lanes, Boolean strings, and Google X-Ray searches.</p>
        <Link href="/" className="mt-8 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Open App</Link>
      </section>
    </main>
  );
}

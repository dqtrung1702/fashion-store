export const StatCard = ({ label, value, hint }) => (
  <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-600">{hint}</p>
  </div>
);

export const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
      active ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700'
    }`}
  >
    {children}
  </button>
);

export const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
    {children}
  </div>
);

export const TextInput = ({ label, hint, ...props }) => (
  <Field label={label} hint={hint}>
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 ${props.className || ''}`}
    />
  </Field>
);

export const TextArea = ({ label, hint, rows = 4, ...props }) => (
  <Field label={label} hint={hint}>
    <textarea
      {...props}
      rows={rows}
      className={`w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 ${props.className || ''}`}
    />
  </Field>
);

export const Checkbox = ({ name, checked, onChange, label }) => (
  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4" />
    {label}
  </label>
);

export const SelectorButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
      active
        ? 'border-slate-950 bg-slate-950 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
    }`}
  >
    {children}
  </button>
);

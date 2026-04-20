import React from 'react';

export default function PageHero({ eyebrow, title, description, image, children }) {
  if (image) {
    return (
      <section
        className="relative flex min-h-[420px] items-end overflow-hidden rounded-[2rem] border border-white/60 bg-cover bg-center px-6 py-10 shadow-[0_25px_80px_rgba(166,99,91,0.11)] md:px-10 md:py-12"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20, 24, 22, 0.12) 0%, rgba(20, 24, 22, 0.82) 100%), url(${image})`,
        }}
      >
        <div className="relative max-w-3xl rounded-[1.5rem] bg-slate-950/25 p-5 text-white backdrop-blur-sm md:p-6">
          {eyebrow && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/90">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-5xl leading-tight md:text-6xl">
            {title}
          </h1>
          {description && <p className="mt-5 max-w-2xl text-lg leading-8 text-white">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 px-6 py-12 shadow-[0_25px_80px_rgba(166,99,91,0.11)] backdrop-blur md:px-10 md:py-16">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(242,215,210,0.50),_rgba(223,233,228,0.58)_45%,_rgba(244,232,199,0.38))]" />
      <div className="relative max-w-3xl">
        {eyebrow && (
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-5xl leading-tight text-slate-950 md:text-6xl">
          {title}
        </h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

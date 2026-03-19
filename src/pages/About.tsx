import { Link } from 'react-router-dom';

export default function About() {
  return (
    <article className="mx-auto max-w-2xl space-y-12 pb-16">
      <header className="space-y-4">
        <h1
          className="font-sign text-5xl tracking-tight text-[var(--color-text-primary)] sm:text-6xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          About Witnss
        </h1>
        <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Why we exist, how we work, and what we stand for.
        </p>
      </header>

      {/* 1. Mission */}
      <section id="mission" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Mission
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Witnss is a testimonial platform, not a punitive one. We center survivor voice and
          public safety by making abuse that would otherwise stay invisible visible—in a way
          that respects both the need for accountability and the limits of what we are.
        </p>
        <blockquote
          className="border-l-4 border-[var(--color-border-strong)] pl-6 text-2xl font-medium italic leading-relaxed text-[var(--color-text-primary)] sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          We are not a law enforcement agency. We do not make legal determinations. We
          compile and display information that survivors and the public have a right to see.
        </blockquote>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Conviction rates for domestic violence are low. Most abuse never reaches a verdict.
          Survivors deserve a record—one that can inform their own choices and the choices of
          others. Witnss exists to fill that gap.
        </p>
      </section>

      {/* 2. How the Tiers Work */}
      <section id="tiers" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          How the Tiers Work
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Every record on Witnss is assigned a tier based on how it was sourced. The tier
          tells you what kind of verification stands behind the information.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Tier 1 — Verified
            </h3>
            <p className="leading-relaxed text-[var(--color-text-primary)]">
              Tier 1 records come from court convictions or final protective orders. They are
              independently verified against public court documents. “Verified” here means we
              have confirmed the information against an official, adjudicated source.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Tier 2 — Documented
            </h3>
            <p className="leading-relaxed text-[var(--color-text-primary)]">
              Tier 2 records are drawn from police reports, arrest records, or civil court
              filings. They are documented in official systems but have not resulted in a
              criminal conviction. The distinction from Tier 1 is important: documented does
              not mean court-adjudicated.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Tier 3 — Community Reported
            </h3>
            <p className="leading-relaxed text-[var(--color-text-primary)]">
              Tier 3 entries are submitted by survivors and community members. Corroboration
              matters: we require two or more independent submissions before a Tier 3 record
              is published. That threshold helps reduce single-allegation abuse of the
              platform while still allowing patterns of abuse to be recorded. Tier 3 records
              are explicitly unverified—we do not independently confirm the underlying facts.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Our Standards */}
      <section id="standards" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Our Standards
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          We will never publish home addresses, exact dates of birth, or unverified
          single allegations. We practice data minimization: we only show what is necessary
          for identification and context.
        </p>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          We do not run advertising. We do not sell data. Witnss is sustained to serve
          survivors and public safety, not third-party interests.{' '}
          <Link
            to="/support"
            className="font-medium text-[var(--color-dispute)] underline underline-offset-2 hover:text-[var(--color-dispute)]/90"
          >
            Support Witnss
          </Link>
          .
        </p>
      </section>

      {/* 4. Dispute Process */}
      <section id="dispute" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Dispute Process
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          If you believe a record about you is inaccurate, you may submit a dispute. You will
          need to provide your name, contact email, the nature of the dispute, and an
          explanation. Disputes are reviewed manually. Records sourced from public court
          documents are only removed when we receive documentation that the record is
          factually incorrect (for example, an expungement order or case dismissal). Tier 3
          community-reported records may be removed with appropriate evidence of
          misidentification or factual error.
        </p>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          <Link
            to="/dispute"
            className="font-medium text-[var(--color-dispute)] underline underline-offset-2 hover:text-[var(--color-dispute)]/90"
          >
            Submit a dispute
          </Link>
        </p>
      </section>

      {/* 5. Legal Framework */}
      <section id="legal" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Legal Framework
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Our Tier 1 and Tier 2 sourcing is conviction- and document-based. That approach
          protects due process: we are surfacing information that has already been through
          official channels or is part of the public record.
        </p>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Tier 3 community-reported content operates under Section 230: we provide a
          platform for user-generated content and are not the publisher of that content for
          liability purposes. We still enforce our standards, review disputes, and remove
          content when appropriate.
        </p>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          Every listed person has a dispute pathway. If you are named on Witnss and believe
          a record is wrong, you can use the process above to request review.
        </p>
        <p className="leading-relaxed text-[var(--color-text-muted)] text-sm">
          Witnss currently operates in the United States only. This is an MVP; we may
          expand jurisdiction and features over time.
        </p>
      </section>

      {/* 6. Contact & Coalition */}
      <section id="contact" className="space-y-6">
        <h2
          className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Contact & Coalition
        </h2>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          We are building partnerships with domestic violence organizations and welcome
          press and research inquiries. For coalition work, press, or general contact:
        </p>
        <p className="leading-relaxed text-[var(--color-text-primary)]">
          <a
            href="mailto:team@witnss.org"
            className="font-medium text-[var(--color-dispute)] underline underline-offset-2 hover:text-[var(--color-dispute)]/90"
          >
            team@witnss.org
          </a>
        </p>
      </section>
    </article>
  );
}

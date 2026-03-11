import { useState } from 'react';
import './pages.css';

type ChangeEntry = { title: string; desc: string };

type Release = {
  version: string;
  date: string;
  channel: 'stable' | 'beta';
  bugs: ChangeEntry[];
  improvements: ChangeEntry[];
  newFeatures: ChangeEntry[];
};

const RELEASES: Release[] = [
  {
    version: 'v1.2.0',
    date: 'March 2026',
    channel: 'stable',
    bugs: [
      {
        title: 'Transaction list canceled filter',
        desc: 'Canceled transactions were incorrectly included in total sales summary. Now excluded from Net Sale, Cost, and Profit stats.',
      },
      {
        title: 'Web dashboard – canceled hidden',
        desc: 'Canceled transactions were not showing in the transaction list on the web dashboard when "All" filter was selected.',
      },
      {
        title: 'Web dashboard – filter not working',
        desc: 'Payment method filter was not correctly applied when switching status filters. Now filters properly compose.',
      },
      {
        title: 'Best selling – product name missing',
        desc: 'Best selling products list on the web dashboard showed "Unknown" instead of the product name for some products.',
      },
      {
        title: 'Chart columns cut off',
        desc: 'Charts on the web dashboard appeared half-cut due to insufficient container height. All chart heights have been increased.',
      },
      {
        title: 'Stock changes – duplicate entries',
        desc: 'Stock changes page was showing one card per sale item line, causing duplicates (e.g., Beras 20g, Beras 20g, Telur 1pcs, Telur 1pcs). Now grouped by sale with all products shown in one card.',
      },
      {
        title: 'Canceled badge clipped',
        desc: 'The CANCELED badge in the transaction list was clipped due to a fixed width on the pill container. Fixed to auto width.',
      },
    ],
    improvements: [
      {
        title: 'Canceled count in transaction summary',
        desc: 'The transaction list summary header now shows a count of canceled transactions alongside Net Sale, Cost, and Profit.',
      },
      {
        title: 'Landing page redesign',
        desc: 'The web landing page has been fully redesigned with a left panel showing app screenshots, a right panel with app name and feature list, and a proper footer.',
      },
      {
        title: 'Release notes page',
        desc: 'This page! Structured release notes with collapsible bug and improvement sections.',
      },
      {
        title: 'Chart sizes increased',
        desc: 'Revenue trend, peak hours, payment, and category charts are all taller and easier to read.',
      },
      {
        title: 'Stock changes grouped by sale',
        desc: 'Each sale now appears as a single stock deduction card listing all products sold, instead of per-item duplicate cards.',
      },
    ],
    newFeatures: [],
  },
  {
    version: 'v1.1.0',
    date: 'March 2026',
    channel: 'stable',
    bugs: [
      {
        title: 'Transaction cancellation styling',
        desc: 'Updated the canceled status badge in transaction list and detail views to be more prominent.',
      },
      {
        title: 'Ingredient delete affecting products',
        desc: 'Deleting an ingredient incorrectly affected associated product data. Fixed to only remove the ingredient itself.',
      },
    ],
    improvements: [
      {
        title: 'POS items sold count',
        desc: 'The POS success screen now shows total quantity of items sold, instead of total item variants.',
      },
      {
        title: 'Transaction list styling',
        desc: 'Enhanced product/item list in the transactions list and detail views with improved visual containers.',
      },
    ],
    newFeatures: [
      {
        title: 'Subscription plan durations',
        desc: 'Duration tabs (1 month, 3 months, 6 months, 1 year) with automatic discounts: 10% for 6-month, 20% for 1-year plans.',
      },
      {
        title: 'Analytics peak hours color coding',
        desc: 'Top 5 peak hours now color-coded: green for #1, yellow for #2, orange for #3, and red for lower ranks.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'February 2026',
    channel: 'stable',
    bugs: [],
    improvements: [],
    newFeatures: [
      {
        title: 'First public release',
        desc: 'Initial launch of DashingBakery mobile app and owner web portal. Manage stores, invite staff, and review sales.',
      },
    ],
  },
];

function AccordionSection({
  label,
  count,
  colorClass,
  items,
}: {
  label: string;
  count: number;
  colorClass: string;
  items: ChangeEntry[];
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div className={`release-accordion ${colorClass}`}>
      <button
        className="release-accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        type="button"
      >
        <span className="release-accordion-label">
          {label}
          <span className="release-accordion-count">{count}</span>
        </span>
        <span className={`release-accordion-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <ul className="release-accordion-list">
          {items.map((item, i) => (
            <li key={i} className="release-accordion-item">
              <p className="release-accordion-item-title">{item.title}</p>
              <p className="release-accordion-item-desc">{item.desc}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const ReleasesPage = () => {
  return (
    <div className="page-shell releases-page">
      <div className="releases-header">
        <div className="tag-pill tag-soft" style={{ marginBottom: '0.75rem' }}>
          📋 Changelog
        </div>
        <h1 className="text-heading">What's new in DashingBakery</h1>
        <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
          Release notes for the mobile app and web dashboard. Stable channel only.
        </p>
      </div>

      <div className="releases-timeline">
        {RELEASES.map((release) => (
          <div key={release.version} className="release-card">
            {/* Version header */}
            <div className="release-card-header">
              <div className="release-version-row">
                <span className="release-version-badge">{release.version}</span>
                <span
                  className={`release-channel-badge ${release.channel === 'stable' ? 'stable' : 'beta'}`}
                >
                  {release.channel}
                </span>
              </div>
              <span className="release-date">{release.date}</span>
            </div>

            {/* Accordions */}
            <div className="release-sections">
              <AccordionSection
                label="🐛 Bug Fixes"
                count={release.bugs.length}
                colorClass="accordion-bugs"
                items={release.bugs}
              />
              <AccordionSection
                label="✨ Improvements"
                count={release.improvements.length}
                colorClass="accordion-improvements"
                items={release.improvements}
              />
              <AccordionSection
                label="🚀 New Features"
                count={release.newFeatures.length}
                colorClass="accordion-features"
                items={release.newFeatures}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

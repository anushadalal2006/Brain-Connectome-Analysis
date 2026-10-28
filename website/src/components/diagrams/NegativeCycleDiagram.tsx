import React from 'react';

// u – v is one undirected negative edge (w < 0). Bellman–Ford treats it as
// two arcs u → v and v → u, which form a cycle of cost 2w < 0.
export const NegativeCycleDiagram: React.FC = () => (
  <svg viewBox="0 0 420 230" width="100%" role="img" aria-labelledby="nc-title" className="diagram" style={{ maxWidth: 460 }}>
    <title id="nc-title">A negative edge between u and v gives the cycle u to v to u with cost 2w, which is below zero</title>
    <defs>
      <marker id="nc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--sign-neg)" />
      </marker>
      <marker id="nc-arrow-grey" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
      </marker>
    </defs>
    {/* source to u */}
    <line x1={62} y1={110} x2={128} y2={110} stroke="var(--text-muted)" strokeWidth={1.6} markerEnd="url(#nc-arrow-grey)" />
    <circle cx={40} cy={110} r={20} fill="var(--bg-tertiary)" stroke="var(--border-strong)" />
    <text x={40} y={115} textAnchor="middle" className="dg-math">s</text>
    {/* u and v */}
    <circle cx={160} cy={110} r={26} fill="var(--bg-secondary)" stroke="var(--text-primary)" strokeWidth={1.5} />
    <text x={160} y={116} textAnchor="middle" className="dg-math">u</text>
    <circle cx={340} cy={110} r={26} fill="var(--bg-secondary)" stroke="var(--text-primary)" strokeWidth={1.5} />
    <text x={340} y={116} textAnchor="middle" className="dg-math">v</text>
    {/* arcs u->v (top) and v->u (bottom), negative = blue dashed */}
    <path d="M182,96 Q250,50 316,96" fill="none" stroke="var(--sign-neg)" strokeWidth={2.2} strokeDasharray="6 4" markerEnd="url(#nc-arrow)" />
    <path d="M318,124 Q250,170 184,124" fill="none" stroke="var(--sign-neg)" strokeWidth={2.2} strokeDasharray="6 4" markerEnd="url(#nc-arrow)" />
    <text x={250} y={58} textAnchor="middle" className="dg-label">cost w &lt; 0</text>
    <text x={250} y={176} textAnchor="middle" className="dg-label">cost w &lt; 0</text>
    <text x={210} y={212} textAnchor="middle" className="dg-label-strong">u → v → u costs 2w &lt; 0</text>
    <text x={210} y={20} textAnchor="middle" className="dg-muted">one undirected negative edge = two arcs</text>
  </svg>
);

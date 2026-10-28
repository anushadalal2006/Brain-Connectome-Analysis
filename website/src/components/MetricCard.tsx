import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'consistent' | 'partial' | 'sensitive' | 'neutral' | 'blue' | 'red';
  };
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, badge, icon }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {title}
          </span>
          {icon && <span style={{ color: 'var(--accent-blue)' }}>{icon}</span>}
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        {subtitle && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {subtitle}
          </span>
        )}
        {badge && (
          <span className={`badge badge-${badge.variant}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

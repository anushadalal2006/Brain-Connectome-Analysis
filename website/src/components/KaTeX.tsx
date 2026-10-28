import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KaTeX: React.FC<KaTeXProps> = ({ math, block = false, className = '' }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`katex-display-wrap ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

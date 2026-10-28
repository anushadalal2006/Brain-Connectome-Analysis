// Shared number formatting. Differences are shown in neutral text with an
// explicit sign (+ / −) because red/blue are reserved for edge sign.
export const signed = (v: number, digits = 2): string => {
  if (v === 0) return (0).toFixed(digits);
  const s = Math.abs(v).toFixed(digits);
  return v > 0 ? `+${s}` : `−${s}`;
};

export const fmtNum = (v: number, digits = 4): string =>
  Number.isInteger(v) ? String(v) : v.toFixed(digits);

export const signedNum = (v: number, digits = 4): string => {
  if (v === 0) return '0';
  const s = fmtNum(Math.abs(v), digits);
  return v > 0 ? `+${s}` : `−${s}`;
};

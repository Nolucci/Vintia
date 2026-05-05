export const theme = {
  bg: {
    primary:   '#F4F6FB',
    secondary: '#EEF1F8',
    bottom:    '#F0F3FA',
  },
  text: {
    primary:   '#1A2332',
    secondary: '#8A9BA8',
    muted:     '#8A9BA8',
  },
  accent: {
    gold:        '#D79A2A',
    goldLight:   '#E8B84B',
    blue:        '#3B82F6',
    teal:        '#2A9D8F',
    buttonText:  '#1A1200',
  },
  radius: {
    sm: 8, md: 12, lg: 14, xl: 16,
  },
  button: {
    height: 56,
  },
} as const;

export const hexAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

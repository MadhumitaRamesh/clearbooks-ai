export const theme = {
  colors: {
    primary: '#D97736', // Warm Amber/Orange
    primaryLight: '#F5A623',
    background: '#FAFAFA', // Warm neutral
    surface: '#FFFFFF',
    text: '#2C2A29', // Dark brown/gray
    textLight: '#7E7A75',
    border: '#E8E6E1',
    success: '#4CAF50',
    error: '#E53935',
    warning: '#FFC107',
    info: '#2196F3'
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '600' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 16,
    xl: 24,
    pill: 9999
  }
};

export type BWPaletteId = 'black' | 'white';

export interface BWPalette {
  id: BWPaletteId;
  name: string;
  subtitle: string;
  description: string;
  isLight: boolean;
  colors: {
    bg: string;
    bgSubtle: string;
    card: string;
    cardHeader: string;
    border: string;
    borderSubtle: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    buttonBg: string;
    buttonText: string;
    buttonHoverBg: string;
    buttonOutlineBorder: string;
    hudBg: string;
    swatchHex: string[];
  };
  runwayFinish: 'obsidian' | 'platinum' | 'chrome' | 'titanium';
}

export const BW_PALETTES: Record<BWPaletteId, BWPalette> = {
  black: {
    id: 'black',
    name: 'Black Theme',
    subtitle: 'Pitch Black & Optical White',
    description: 'Pure void black canvas with razor-sharp optical white accents and brutalist contrast.',
    isLight: false,
    colors: {
      bg: '#000000',
      bgSubtle: '#09090c',
      card: '#0a0a0e',
      cardHeader: '#111116',
      border: '#27272a',
      borderSubtle: '#18181b',
      borderStrong: '#52525b',
      textPrimary: '#ffffff',
      textSecondary: '#d4d4d8',
      textMuted: '#71717a',
      accent: '#ffffff',
      buttonBg: '#ffffff',
      buttonText: '#000000',
      buttonHoverBg: '#e4e4e7',
      buttonOutlineBorder: '#3f3f46',
      hudBg: 'rgba(0, 0, 0, 0.94)',
      swatchHex: ['#000000', '#ffffff'],
    },
    runwayFinish: 'obsidian',
  },
  white: {
    id: 'white',
    name: 'White Theme',
    subtitle: 'Pure Stark White & Pitch Black',
    description: 'Ultra-clean stark white gallery aesthetic with deep architectural black lettering.',
    isLight: true,
    colors: {
      bg: '#ffffff',
      bgSubtle: '#f4f4f5',
      card: '#ffffff',
      cardHeader: '#f4f4f5',
      border: '#e4e4e7',
      borderSubtle: '#f4f4f5',
      borderStrong: '#71717a',
      textPrimary: '#09090b',
      textSecondary: '#27272a',
      textMuted: '#71717a',
      accent: '#000000',
      buttonBg: '#000000',
      buttonText: '#ffffff',
      buttonHoverBg: '#27272a',
      buttonOutlineBorder: '#d4d4d8',
      hudBg: 'rgba(255, 255, 255, 0.94)',
      swatchHex: ['#ffffff', '#000000'],
    },
    runwayFinish: 'platinum',
  },
};

export const THEME_PALETTE_KEY = 'upndown_bw_palette';
export const THEME_PALETTE_EVENT = 'upndown_palette_changed';

export function getStoredPalette(): BWPaletteId {
  if (typeof window === 'undefined') return 'white';
  try {
    const val = localStorage.getItem(THEME_PALETTE_KEY);
    if (val === 'black') return 'black';
    if (val === 'white') return 'white';
    // Starting default is white theme; customer can change as needed
    return 'white';
  } catch (e) {
    return 'white';
  }
}

export function setStoredPalette(id: BWPaletteId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_PALETTE_KEY, id);
    applyPaletteCSS(id);
    window.dispatchEvent(new CustomEvent(THEME_PALETTE_EVENT, { detail: id }));
  } catch (e) {
    console.error('Failed to set palette', e);
  }
}

export function applyPaletteCSS(id: BWPaletteId): void {
  if (typeof document === 'undefined') return;
  const palette = BW_PALETTES[id] || BW_PALETTES.white;
  const root = document.documentElement;

  root.style.setProperty('--bg-main', palette.colors.bg);
  root.style.setProperty('--bg-subtle', palette.colors.bgSubtle);
  root.style.setProperty('--bg-card', palette.colors.card);
  root.style.setProperty('--bg-card-header', palette.colors.cardHeader);
  root.style.setProperty('--border-main', palette.colors.border);
  root.style.setProperty('--border-subtle', palette.colors.borderSubtle);
  root.style.setProperty('--border-strong', palette.colors.borderStrong);
  root.style.setProperty('--text-primary', palette.colors.textPrimary);
  root.style.setProperty('--text-secondary', palette.colors.textSecondary);
  root.style.setProperty('--text-muted', palette.colors.textMuted);
  root.style.setProperty('--accent-main', palette.colors.accent);
  root.style.setProperty('--btn-bg', palette.colors.buttonBg);
  root.style.setProperty('--btn-text', palette.colors.buttonText);
  root.style.setProperty('--btn-hover-bg', palette.colors.buttonHoverBg);

  if (palette.isLight) {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }
}

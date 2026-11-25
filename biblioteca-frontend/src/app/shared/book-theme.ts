export interface BookCoverTheme {
  nombre: string;
  fondo: string;
  acento: string;
  borde: string;
  patron: string;
}

const BOOK_COVER_THEMES: BookCoverTheme[] = [
  {
    nombre: 'Terciopelo Índigo',
    fondo: 'linear-gradient(150deg, #1e2752 0%, #111834 55%, #090d1f 100%)',
    acento: '#f5c469',
    borde: 'rgba(245, 196, 105, 0.38)',
    patron: 'radial-gradient(circle at 80% 18%, rgba(245, 196, 105, 0.16) 0%, transparent 45%), radial-gradient(circle at 22% 85%, rgba(99, 102, 241, 0.22) 0%, transparent 50%)'
  },
  {
    nombre: 'Esmeralda Clásica',
    fondo: 'linear-gradient(150deg, #134639 0%, #0b2e26 55%, #061c17 100%)',
    acento: '#e7c17a',
    borde: 'rgba(231, 193, 122, 0.38)',
    patron: 'radial-gradient(circle at 82% 20%, rgba(231, 193, 122, 0.17) 0%, transparent 45%), radial-gradient(circle at 18% 82%, rgba(16, 185, 129, 0.18) 0%, transparent 48%)'
  },
  {
    nombre: 'Borgoña Editorial',
    fondo: 'linear-gradient(150deg, #5c1f2c 0%, #3a111b 55%, #20090f 100%)',
    acento: '#f4c983',
    borde: 'rgba(244, 201, 131, 0.36)',
    patron: 'radial-gradient(circle at 78% 18%, rgba(244, 201, 131, 0.18) 0%, transparent 45%), radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.16) 0%, transparent 50%)'
  },
  {
    nombre: 'Amatista Real',
    fondo: 'linear-gradient(150deg, #3e2058 0%, #261238 55%, #14091f 100%)',
    acento: '#ecc785',
    borde: 'rgba(236, 199, 133, 0.35)',
    patron: 'radial-gradient(circle at 80% 22%, rgba(236, 199, 133, 0.15) 0%, transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.22) 0%, transparent 50%)'
  },
  {
    nombre: 'Cobalto Profundo',
    fondo: 'linear-gradient(150deg, #173866 0%, #0e2444 55%, #081529 100%)',
    acento: '#f0ca7d',
    borde: 'rgba(240, 202, 125, 0.36)',
    patron: 'radial-gradient(circle at 84% 18%, rgba(240, 202, 125, 0.17) 0%, transparent 44%), radial-gradient(circle at 18% 85%, rgba(56, 189, 248, 0.18) 0%, transparent 48%)'
  },
  {
    nombre: 'Cuero Espresso',
    fondo: 'linear-gradient(150deg, #4b2e1f 0%, #2f1c12 55%, #1a0f0a 100%)',
    acento: '#f6cb7c',
    borde: 'rgba(246, 203, 124, 0.4)',
    patron: 'radial-gradient(circle at 80% 20%, rgba(246, 203, 124, 0.18) 0%, transparent 46%), radial-gradient(circle at 22% 84%, rgba(217, 119, 6, 0.2) 0%, transparent 50%)'
  },
  {
    nombre: 'Petróleo Nórdico',
    fondo: 'linear-gradient(150deg, #133c4b 0%, #0c2631 55%, #06151c 100%)',
    acento: '#ecc57b',
    borde: 'rgba(236, 197, 123, 0.36)',
    patron: 'radial-gradient(circle at 82% 20%, rgba(236, 197, 123, 0.16) 0%, transparent 45%), radial-gradient(circle at 20% 82%, rgba(20, 184, 166, 0.18) 0%, transparent 50%)'
  }
];

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #4f7df3 0%, #2b4bb8 100%)',
  'linear-gradient(135deg, #e5a93c 0%, #b4690e 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
  'linear-gradient(135deg, #ec4899 0%, #9d174d 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
];

export function obtenerTemaPortada(semilla: number | string | null | undefined): BookCoverTheme {
  let hash = 0;
  if (typeof semilla === 'number') {
    hash = Math.abs(semilla);
  } else if (typeof semilla === 'string' && semilla.length > 0) {
    for (let i = 0; i < semilla.length; i++) {
      hash = (hash * 31 + semilla.charCodeAt(i)) >>> 0;
    }
  }
  return BOOK_COVER_THEMES[hash % BOOK_COVER_THEMES.length];
}

export function obtenerGradienteAvatar(semilla: number | string | null | undefined): string {
  let hash = 0;
  const texto = String(semilla ?? '0');
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function obtenerIniciales(nombre?: string | null, apellido?: string | null): string {
  const n = (nombre ?? '').trim();
  const a = (apellido ?? '').trim();
  if (n && a) return `${n[0]}${a[0]}`.toUpperCase();
  const partes = n.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  return (n[0] ?? 'A').toUpperCase();
}

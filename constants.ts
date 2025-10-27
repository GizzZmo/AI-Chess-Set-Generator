
import { PieceType } from './types';

export const PIECE_TYPES_ORDERED: PieceType[] = [
  PieceType.KING,
  PieceType.QUEEN,
  PieceType.ROOK,
  PieceType.BISHOP,
  PieceType.KNIGHT,
  PieceType.PAWN,
];

export const DEFAULT_PIECE_DESCRIPTIONS: Record<PieceType, string> = {
  [PieceType.KING]: "A majestic and commanding King chess piece",
  [PieceType.QUEEN]: "An elegant and powerful Queen chess piece",
  [PieceType.ROOK]: "A sturdy and formidable Rook chess piece, resembling a castle tower",
  [PieceType.BISHOP]: "A wise and strategic Bishop chess piece, with a distinctive mitre-like top",
  [PieceType.KNIGHT]: "A dynamic and agile Knight chess piece, typically represented by a horse's head and neck",
  [PieceType.PAWN]: "A humble yet determined Pawn chess piece, the frontline footsoldier of the set",
};

export const EXAMPLE_THEMES = [
  {
    theme: 'Sunken City of Atlantis',
    artDirection: 'Bioluminescent coral structures, ancient water-worn marble, shimmering mother-of-pearl inlays, and captured streams of light. The mood is mysterious, ancient, and ethereal, with a color palette of deep sea blues, glowing turquoise, and soft gold accents.',
  },
  {
    theme: 'Steampunk Aviators',
    artDirection: 'Polished brass and copper, intricate clockwork gears, rich mahogany, and worn leather textures define the set. Pieces feature glowing vacuum tubes and mechanical details. The lighting is warm and industrial, evoking a Victorian workshop ambiance.',
  },
  {
    theme: 'Origami Warriors',
    artDirection: 'Crisp, folded paper textures with sharp, geometric lines. A minimalist color palette of off-white, charcoal grey, and a single vibrant accent color like crimson. The lighting is soft and diffuse, casting gentle shadows that emphasize the intricate folded forms.',
  }
];

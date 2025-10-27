
export enum PieceType {
  KING = 'King',
  QUEEN = 'Queen',
  ROOK = 'Rook',
  BISHOP = 'Bishop',
  KNIGHT = 'Knight',
  PAWN = 'Pawn',
}

export interface ChessPieceImage {
  type: PieceType;
  imageUrl: string | null; // base64 string
  promptUsed?: string; // The actual prompt used for generation
}

export type ChessSet = Record<PieceType, ChessPieceImage>;

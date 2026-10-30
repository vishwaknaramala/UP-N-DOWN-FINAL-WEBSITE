export type ProductCategory = 'all' | 'caps' | 'pants' | 'tshirts';

export interface GarmentColorway {
  name: string;
  hex: string;
  subtext: string;
}

export interface CustomApparelDesign {
  colorHex: string;
  colorName: string;
  artworkPreset: 'monogram' | 'star' | 'mantra' | 'barcode' | 'blank' | 'custom';
  customArtworkUrl?: string;
  artworkPosition: 'chest' | 'pocket' | 'back' | 'hem' | 'capFront' | 'capSide';
  artworkScale: 'small' | 'medium' | 'large';
  artworkColor: string;
  customText?: string;
  finishStyle: 'clean' | 'raw' | 'acid' | 'distressed';
}

export interface TechnicalEmbroiderySpec {
  placement: string;
  artworkName: string;
  stitchType: string;
  dimensions: string;
  threadColors: string[];
  technicalNotes: string;
}

export interface SizeMeasurementRow {
  size: string;
  measurements: Record<string, string>;
}

export interface InternationalModel {
  name: string;
  agency: string;
  city: string;
  height: string;
  sizeWorn: string;
  stylingNotes: string;
  quote?: string;
}

export interface GarmentItem {
  id: string;
  name: string;
  styleCode: string;
  category: 'caps' | 'pants' | 'tshirts';
  categoryLabel: string;
  tagline: string;
  gsm: number;
  weightLabel: string;
  editionLimit: number;
  fit: string;
  composition: string;
  features: string[];
  colorways: GarmentColorway[];
  sizes: string[];
  dimensions: {
    chest?: string;
    waist?: string;
    length: string;
    shoulder?: string;
    sleeve?: string;
    inseam?: string;
    legOpening?: string;
  };
  isDesignSealed: boolean;
  confidentialCode: string;
  embroiderySpecs?: TechnicalEmbroiderySpec[];
  sizeChart?: SizeMeasurementRow[];
  wornByModels?: InternationalModel[];
  hardwareDetails?: string[];
  customDesign?: CustomApparelDesign;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain';
  additionalImages?: string[];
}

export interface WaitlistSubmission {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  sizePreference: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  categories: string[];
  passCode: string;
  cryptoSignature: string;
  positionNumber: number;
  createdAt: string;
  launchDate: string;
  customizedPiece?: string;
}

export interface DropPollOption {
  id: string;
  title: string;
  description: string;
  votes: number;
}

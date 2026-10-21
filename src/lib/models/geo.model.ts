export interface Region {
  id: number;
  nomFr: string;
  nomAr: string;
  code: string;
}

export interface Province {
  id: number;
  nomFr: string;
  nomAr: string;
  code: string;
  region?: Region;
}

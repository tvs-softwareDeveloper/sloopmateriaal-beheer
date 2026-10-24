export type Material = {
  id: string;
  name: string;
  material_type: 
    | 'wood' 
    | 'metal' 
    | 'concrete' 
    | 'brick' 
    | 'glass' 
    | 'fixtures' 
    | 'appliances' 
    | 'roofing' 
    | 'plumbing' 
    | 'electrical' 
    | 'other';
  quantity: number;
  unit?: 
    | 'pieces' 
    | 'kg' 
    | 'lbs' 
    | 'sqft' 
    | 'sqm' 
    | 'linear_ft' 
    | 'linear_m' 
    | 'pallets' 
    | 'boxes';
  status: 
    | 'available' 
    | 'reserved' 
    | 'for_sale' 
    | 'for_reuse' 
    | 'for_disposal' 
    | 'sold' 
    | 'recycled'
    | 'disposed';
  location?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  qr_code?: string;
  images?: string[];
  price?: number;
  project_name?: string;
  created_date?: string;
};

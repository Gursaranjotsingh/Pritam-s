export type SpiceLevel = "mild" | "medium" | "hot" | "extra_hot";
export type ProductStatus = "draft" | "active" | "archived";

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  ingredients: string | null;
  spice_level: SpiceLevel;
  weight_grams: number | null;
  price_paise: number;
  compare_at_price_paise: number | null;
  max_qty_per_order: number;
  status: ProductStatus;
  is_featured: boolean;
  sort_order: number;
  product_images?: ProductImage[];
  inventory?: {
    quantity_available: number;
    low_stock_threshold: number;
    is_sold_out: boolean;
  } | null;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  pricePaise: number;
  quantity: number;
  maxQtyPerOrder: number;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "online" | "cod";

export interface Settings {
  store_name: string;
  store_tagline: string;
  whatsapp_number: string;
  currency: string;
  shipping_charge_paise: number;
  free_shipping_threshold_paise: number;
  cod_enabled: boolean;
  cod_fee_paise: number;
  cod_max_order_paise: number;
  low_stock_threshold_default: number;
  estimated_delivery_days: string;
  store_available: boolean;
}

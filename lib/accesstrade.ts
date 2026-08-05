const BASE_URL = "https://api.accesstrade.vn/v1";

export type AccesstradeDomain = "shopee.vn" | "tiki.vn";

export interface AccesstradeProduct {
  aff_link: string;
  campaign: string;
  cate: string;
  desc: string;
  discount: number;
  discount_amount: number;
  discount_rate: number;
  domain: string;
  image: string;
  merchant: string;
  name: string;
  price: number;
  product_id: string;
  shop_id: string;
  shop_name: string;
  sku: string;
  status_discount: number;
  update_time: string;
  url: string;
}

interface DatafeedResponse {
  data: AccesstradeProduct[];
  total: number;
}

function apiKey(): string {
  const key = process.env.ACCESSTRADE_API_KEY;
  if (!key) throw new Error("Missing ACCESSTRADE_API_KEY env var");
  return key;
}

export async function fetchDatafeedPage(
  domain: AccesstradeDomain,
  page: number,
  limit = 100,
): Promise<DatafeedResponse> {
  const url = `${BASE_URL}/datafeeds?domain=${domain}&limit=${limit}&page=${page}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${apiKey()}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Accesstrade datafeed request failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

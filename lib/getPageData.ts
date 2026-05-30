import { cache } from "react";
import { connectTenantDB } from "./db";
import { ObjectId } from "mongodb";
import { isHex } from "@/app/api/ecommerce/categories/util";


function serialize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (_, value) => {
    if (value instanceof ObjectId) {
      return value.toString();
    }
    return value;
  }));
}




export const getPageData = cache(async (slug: string) => {
  const tenantId = process.env.TENANT_DB_NAME || "";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${API_URL}/api/cms/pages?slug=${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-db": tenantId,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch page data for slug: ${slug}, status: ${res.status}`);
      return null;
    }

    const json = await res.json();
    // Support both wrapped { data: ... } and direct response formats
    const data = json.data !== undefined ? json.data : json;
    

    return serialize(data);
  } catch (error) {
    console.error(`Error in getPageData for slug: ${slug}`, error);
    return null;
  }
});

export const getSingleProduct = cache(async (id: string) => {
  const tenantId = process.env.TENANT_DB_NAME || "kp_nestcraft";
 const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`/api/commerce/products/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-db": tenantId,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch product data for id: ${id}, status: ${res.status}`);
      return null;
    }

    const json = await res.json();
    // Support both wrapped { data: ... } and direct response formats
    const data = json.data !== undefined ? json.data : json;
    

    return serialize(data);
  } catch (error) {
    console.error(`Error in getSingleProduct for id: ${id}`, error);
    return null;
  }
});

export const getTenantRegistry = cache(async () => {
  const db = await connectTenantDB();
  const tenantRegistry = db.collection("tenant_registry");

  const tenant = await tenantRegistry.findOne({ type: "branding" });

  return serialize(tenant);
});

export const getBusinessBlueprint = cache(async () => {
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const tenantId = process.env.TENANT_DB_NAME || "kp_nestcraft";

  try {
    const response = await fetch(
      `${API_URL}/cms/business-blueprint`,
      {
        headers: {
          'Content-Type': 'application/json',
          "x-tenant-db": tenantId || "kp_nestcraft",
        },
        credentials: "include",
      },
    );
    const json = await response.json();
    const data = json.data !== undefined ? json.data : json;
    return serialize(data);
  } catch (error) {
    console.error("Error fetching business blueprint:", error);
    return null;
  }
});

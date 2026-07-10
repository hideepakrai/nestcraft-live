import { cache } from "react";
import { connectTenantDB } from "./db";
import { ObjectId } from "mongodb";
import { isHex } from "@/app/api/ecommerce/categories/util";

function serialize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      if (value instanceof ObjectId) {
        return value.toString();
      }
      return value;
    }),
  );
}

export const getPageData = cache(async (slug: string) => {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "";
  const API_URL = process.env.OWN_URL;
  try {
    const res = await fetch(`${API_URL}/api/cms/pages?slug=${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-db": tenantId,
      },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.error(
          `Failed to fetch page data for slug: ${slug}, status: ${res.status}`,
        );
      } else {
        console.warn(
          `Page data not found for slug: ${slug} (status: 404)`,
        );
      }
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
  const API_URL = process.env.OWN_URL || "http://localhost:3000";
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "kp_nestcraft";

  try {
    const res = await fetch(`${API_URL}/api/commerce/products/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-db": tenantId,
      },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.error(
          `Failed to fetch product data for id: ${id}, status: ${res.status}`,
        );
      } else {
        console.warn(
          `Product data not found for id: ${id} (status: 404)`,
        );
      }
      return null;
    }

    const json = await res.json();
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
  const API_URL = process.env.OWN_URL;
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  try {
    const response = await fetch(`${API_URL}/api/platform/business-blueprint`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-db": tenantId!,
      },
      credentials: "include",
    });
    const json = await response.json();
    const data = json.data !== undefined ? json.data : json;
    console.log("get blueprint--->", data);
    return serialize(data);
  } catch (error) {
    console.error("Error fetching business blueprint:", error);
    return null;
  }
});

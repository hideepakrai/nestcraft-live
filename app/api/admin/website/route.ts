import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const headers = new Headers();
    
    // Extract headers from the incoming request
    const xTenantDb = req.headers.get("x-tenant-db");
    const authToken = req.headers.get("auth-token") || req.headers.get("authorization"); // Fallback to authorization just in case
    const tenantSlug = req.headers.get("tenant-slug") || req.headers.get("tenant_slug");

    if (xTenantDb) {
      headers.set("x-tenant-db", xTenantDb);
    }

    if (tenantSlug) {
      headers.set("tenant-slug", tenantSlug);
      headers.set("tenant_slug", tenantSlug);
    }
    
    const contentType = req.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else {
      headers.set("Content-Type", "application/json");
    }

    // Endpoint shown in the Swagger image
    const url = `${FASTAPI_URL}/cms/business-blueprint`;
    
    console.log(`Proxying GET request to FastAPI: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    // Check content type to appropriately format the response
    const contentTypeRes = response.headers.get("content-type");
    if (contentTypeRes?.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: { "Content-Type": contentTypeRes || "text/plain" }
      });
    }
  } catch (error: any) {
    console.error(`Error fetching business blueprint:`, error);
    return NextResponse.json({ error: "Failed to connect to backend service" }, { status: 500 });
  }
}

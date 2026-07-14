


import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
const FASTAPI_URL = `${API_BASE_URL}/api`;
const TENANT_DB_NAME = process.env.NEXT_PUBLIC_TENANT_ID;

export async function proxyRequest(
  req: NextRequest,
  targetPath: string,
  options: { addApiPrefix?: boolean } = {},
) {
  const searchParams = req.nextUrl.searchParams.toString();
  const baseBackendUrl = options.addApiPrefix
    ? `${FASTAPI_URL}/api`
    : FASTAPI_URL;
  const url = `${baseBackendUrl}/${targetPath}${searchParams ? `?${searchParams}` : ""}`;

  const headers = new Headers();

  const headersToForward = [
    "authorization",
    "cookie",
    "content-type",
    "x-tenant-db",
    "accept",
    "tenant-slug",
    "tenant_slug",
    "auth-token",
  ];

  headersToForward.forEach((headerName) => {
    const value = req.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  });

  if (TENANT_DB_NAME && !headers.has("x-tenant-db")) {
    headers.set("x-tenant-db", TENANT_DB_NAME);
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: headers,
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    try {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await req.json();
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = await req.blob();
      }
    } catch (e) {
      // No body or error parsing
    }
  }

  try {
    console.log(`[Proxy] ${req.method} ${req.nextUrl.pathname} -> ${url}`);
    const response = await fetch(url, fetchOptions);

    // Build the outgoing response (same body logic as before)
    let nextResponse: NextResponse;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      nextResponse = NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      nextResponse = new NextResponse(text, {
        status: response.status,
        headers: { "Content-Type": contentType || "text/plain" },
      });
    }

    // ✅ Relay Set-Cookie headers from the backend to the browser.
    // getSetCookie() handles multiple cookies correctly (Node 18.17+ / Next 14+)
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")!]
          : [];

    const isSecureRequest =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    setCookies.forEach((cookie) => {
      const parts = cookie.split(";").map((p) => p.trim());
      const [nameValue, ...attrParts] = parts;
      if (!nameValue) return;

      const eqIndex = nameValue.indexOf("=");
      if (eqIndex === -1) return;

      const name = nameValue.substring(0, eqIndex);
      const value = nameValue.substring(eqIndex + 1);

      const options: any = {
        path: "/",
      };

      attrParts.forEach((attr) => {
        const lowerAttr = attr.toLowerCase();
        if (lowerAttr.startsWith("max-age=")) {
          options.maxAge = parseInt(attr.substring(8), 10);
        } else if (lowerAttr.startsWith("path=")) {
          options.path = attr.substring(5);
        } else if (lowerAttr === "httponly") {
          options.httpOnly = true;
        } else if (lowerAttr === "secure") {
          options.secure = true;
        } else if (lowerAttr.startsWith("samesite=")) {
          const sameSiteValue = attr.substring(9).toLowerCase();
          if (sameSiteValue === "lax") options.sameSite = "lax";
          else if (sameSiteValue === "strict") options.sameSite = "strict";
          else if (sameSiteValue === "none") options.sameSite = "none";
        }
      });

      if (!isSecureRequest) {
        options.secure = false;
        if (options.sameSite === "none") {
          options.sameSite = "lax";
        }
      }

      nextResponse.cookies.set(name, value, options);
    });

    return nextResponse;
  } catch (error) {
    console.error(`[Proxy Error] ${url}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend service" },
      { status: 500 },
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
// const FASTAPI_URL = `${API_BASE_URL}/api`;
// const TENANT_DB_NAME = process.env.NEXT_PUBLIC_TENANT_ID;

// export async function proxyRequest(
//   req: NextRequest,
//   targetPath: string,
//   options: { addApiPrefix?: boolean } = {}
// ) {
//   const searchParams = req.nextUrl.searchParams.toString();
//   const baseBackendUrl = options.addApiPrefix ? `${FASTAPI_URL}/api` : FASTAPI_URL;
//   const url = `${baseBackendUrl}/${targetPath}${searchParams ? `?${searchParams}` : ""}`;

//   const headers = new Headers();

//   // Forward relevant headers
//   const headersToForward = [
//     "authorization",
//     "cookie",
//     "content-type",
//     "x-tenant-db",
//     "accept",
//     "tenant-slug",
//     "tenant_slug",
//     "auth-token"
//   ];

//   headersToForward.forEach(headerName => {
//     const value = req.headers.get(headerName);
//     if (value) {
//       headers.set(headerName, value);
//     }
//   });

//   // Fallback to .env if x-tenant-db not already set by frontend
//   if (TENANT_DB_NAME && !headers.has("x-tenant-db")) {
//     headers.set("x-tenant-db", TENANT_DB_NAME);
//   }

//   const fetchOptions: RequestInit = {
//     method: req.method,
//     headers: headers,
//   };

//   if (["POST", "PUT", "PATCH"].includes(req.method)) {
//     try {
//       const contentType = req.headers.get("content-type");
//       if (contentType?.includes("application/json")) {
//         const body = await req.json();
//         fetchOptions.body = JSON.stringify(body);
//       } else {
//         fetchOptions.body = await req.blob();
//       }
//     } catch (e) {
//       // No body or error parsing
//     }
//   }

//   try {
//     console.log(`[Proxy] ${req.method} ${req.nextUrl.pathname} -> ${url}`);
//     const response = await fetch(url, fetchOptions);

//     // Check if response is JSON
//     const contentType = response.headers.get("content-type");
//     if (contentType?.includes("application/json")) {
//       const data = await response.json();
//       return NextResponse.json(data, { status: response.status });
//     } else {
//       const text = await response.text();
//       return new NextResponse(text, {
//         status: response.status,
//         headers: { "Content-Type": contentType || "text/plain" }
//       });
//     }
//   } catch (error) {
//     console.error(`[Proxy Error] ${url}:`, error);
//     return NextResponse.json(
//       { success: false, error: "Failed to connect to backend service" },
//       { status: 500 }
//     );
//   }
// }

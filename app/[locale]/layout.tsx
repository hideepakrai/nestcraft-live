import type { Metadata } from "next";
import "../globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import StoreProvider from "@/app/StoreProvider";
import { cn } from "@/lib/utils";
import ChunkErrorRecovery from "@/components/ChunkErrorRecovery";
import { cookies } from "next/headers";
import { getBusinessBlueprint, getTenantRegistry } from "@/lib/getPageData";
import { getAuthUser } from "@/lib/getSingleUser";
import BrandingInitializer from "@/components/branding/BrandingInitializer";
import BusinessBlueprintDataInitialiser from "@/components/businessBluePrints/BusinessBlueprintDataInitialiser";
import ThemeInitializer from "@/components/theme/ThemeInitializer";
import GetUser from "@/lib/GetAllDetails/GetUser";
import { Inter } from "next/font/google";
import FetchAllData from "@/components/pages/FetchAllData";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NestCraft Interiors",
  description:
    "Design-led interiors and furniture storefront built with Next.js.",
  icons: {
    icon: "/assets/Image/favicon.svg",
    shortcut: "/assets/Image/favicon.svg",
    apple: "/assets/Image/favicon.svg",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const [tenantRegistry, businessBlueprint, user] = await Promise.all([
    getTenantRegistry(),
    getBusinessBlueprint(),
    token ? getAuthUser(token).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <html
      lang={locale || "en"}
      suppressHydrationWarning
      className={cn("font-sans", inter.variable)}
    >
      <body>
        {/* <ChunkErrorRecovery /> */}
        <StoreProvider>
          <BrandingInitializer initialConfig={tenantRegistry} />
          <BusinessBlueprintDataInitialiser
            businessBlueprint={businessBlueprint}
          />
          <ThemeInitializer />
          <Providers>
            <GetUser user={user} />
              <FetchAllData/>
            <LayoutWrapper brandConfig={tenantRegistry}>
              {children}
            </LayoutWrapper>
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}

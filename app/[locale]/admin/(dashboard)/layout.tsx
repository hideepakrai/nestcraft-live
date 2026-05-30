import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Bell, Shield } from "lucide-react";
import StoreProvider from "@/app/StoreProvider";
import { getTenantRegistry } from "@/lib/getPageData";
import BrandingInitializer from "@/components/branding/BrandingInitializer";
import GetAllAttributes from "@/lib/GetAllDetails/GetAllAttributes";
import GetAllCategories from "@/lib/GetAllDetails/GetAllCategories";
import GetAllProducts from "@/lib/GetAllDetails/GetAllProducts";
import GetCart from "@/lib/GetAllDetails/GetCart";
import GetUser from "@/lib/GetAllDetails/GetUser";
import GetAllForms from "@/lib/GetAllDetails/GetAllForms";
import { getAuthUser } from "@/lib/getSingleUser";
import { Toaster } from "sonner";
import FetchAllData from "@/components/pages/FetchAllData";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_change_me_in_prod";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const tenantRegistry = await getTenantRegistry();

  let isAuthenticated = false;

  let user: any = null;

  if (token) {
    try {
      user = await getAuthUser(token);
      if (user?.role == "customer") {
        redirect("/");
      }
      if (user) {
        isAuthenticated = true;
      }
      // let check = jwt.verify(token, JWT_SECRET);
      // if (check) {
      //   isAuthenticated = true;
      //   user = jwt.decode(token);
      // }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <StoreProvider>
      <Toaster />
      <BrandingInitializer initialConfig={tenantRegistry} />
      <GetUser user={user} />

      <FetchAllData/>
      {/* <GetAllAttributes />
     */}
      {/* <GetAllProducts /> */}
      {/* <GetCart /> */}
      {/* <GetAllForms /> */}

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-slate-50 flex flex-col min-w-0 min-h-screen">
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="-ml-2 text-slate-400 hover:text-primary transition-all" />
              <Separator orientation="vertical" className="h-6 bg-slate-100" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/admin"
                      className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] hover:text-primary transition-colors"
                    >
                      Admin Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-slate-200" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                      Global Management
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-none bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  System Status Online
                </span>
              </div>
              <div className="h-11 w-11 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-sm">
                <Bell size={18} strokeWidth={2.5} />
              </div>
              <div className="h-11 w-11 rounded-none bg-primary border border-primary/20 flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <Shield size={20} strokeWidth={2.5} />
              </div>
            </div>
          </header>
          <div className="flex-1 flex flex-col p-8 md:p-12 w-full animate-in fade-in slide-in-from-bottom-2 duration-1000 overflow-x-hidden relative">
            <div className="relative z-10 flex-1 flex flex-col">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StoreProvider>
  );
}

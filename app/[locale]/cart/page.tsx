import { Metadata } from "next";
import Component from '@/components/pages/CartPage';

export const metadata: Metadata = {
  title: "Shopping Cart | NestCraft Living",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Component />;
}

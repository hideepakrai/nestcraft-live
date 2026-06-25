"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppSelector, useAppDispatch } from "../../lib/store/hooks";
import { selectCartTotal } from "../../lib/store/cart/cartSlice";
import {
  removeFromCartAsync,
  updateQuantityAsync,
} from "../../lib/store/cart/cartThunk";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

const CartPage = () => {
  const { items: cart, loading } = useSelector(
    (state: RootState) => state.cart,
  );
  const cartTotal = useAppSelector(selectCartTotal);
  const dispatch = useAppDispatch();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-[5%]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
            <ShoppingBag size={40} className="text-muted" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Loading cart...
          </h1>
          <p className="text-muted font-semibold mb-10">
            Please wait while we load your cart.
          </p>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-[5%]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
            <ShoppingBag size={40} className="text-muted" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Your cart is empty
          </h1>
          <p className="text-muted font-semibold mb-10">
            Looks like you haven't added anything to your cart yet. Explore our
            collections to find the perfect piece for your home.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-primary text-white px-10 h-14 rounded-full text-[15px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all"
          >
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-12 px-[5%] max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <Link
          href="/shop"
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-surface transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[42px] font-bold tracking-tight">Shopping Cart</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
        {/* Cart Items */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => {
              const variantImageId = item.selectedVariant?.imageId;
              const imageUrl = (variantImageId && item.gallery?.find((d: any) => d.id === variantImageId)?.url)
                || item.gallery?.find((d) => d.id === item.primaryImageId)?.url
                || item.gallery?.[0]?.url
                || "/assets/Image/Sofa.jpg";
              const alt = item.gallery?.find(
                (d) => d.id === (variantImageId || item.primaryImageId),
              )?.alt || item.name || "";
              return (
                <motion.div
                  key={item.cartItemId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-6 pb-8 border-b border-border group"
                >
                  <div className="w-32 h-40 bg-surface rounded-2xl overflow-hidden border border-border flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={alt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold tracking-tight group-hover:text-secondary transition-colors">
                          <Link href={`/product/${item._id}`}>{item.name}</Link>
                        </h3>
                        <button
                          onClick={() =>
                            dispatch(
                              removeFromCartAsync(String(item.cartItemId)),
                            )
                          }
                          className="text-muted hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-muted font-bold uppercase tracking-wider mb-2">
                        {item.primaryCategoryId}
                      </p>
                      {item.selectedOptions &&
                        Object.entries(item.selectedOptions).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {Object.entries(item.selectedOptions).map(
                              ([key, value]) => (
                                <span
                                  key={key}
                                  className="text-[10px] font-black uppercase bg-muted/20 px-2.5 py-1 rounded-md border border-border/40 text-foreground/70"
                                >
                                  {key}: {value}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                      <p className="text-lg font-black text-secondary">
                        {item.selectedVariant?.price
                          ? formatPrice(Number(item.selectedVariant.price))
                          : item.price || ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-border rounded-full h-10 px-2 bg-surface">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantityAsync({
                                cartItemId: String(item.cartItemId),
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:text-secondary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantityAsync({
                                cartItemId: String(item.cartItemId),
                                quantity: item.quantity + 1,
                              }),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:text-secondary transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border p-8 rounded-3xl sticky top-[140px]"
        >
          <h2 className="text-2xl font-bold mb-8 tracking-tight">
            Order Summary
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-muted font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-muted font-semibold">
              <span>Shipping</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between text-muted font-semibold">
              <span>Tax (GST 18%)</span>
              <span>{formatPrice(cartTotal * 0.18)}</span>
            </div>
            <div className="h-px bg-border my-4" />
            <div className="flex justify-between text-xl font-black">
              <span>Total</span>
              <span className="text-secondary">
                {formatPrice(cartTotal * 1.18)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full bg-primary text-white h-14 rounded-full text-[15px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </Link>

          <p className="text-[11px] text-center text-muted font-bold uppercase tracking-widest mt-6">
            Secure SSL Encrypted Checkout
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;

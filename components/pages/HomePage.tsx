"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";

import { Link } from "@/lib/router";
import { AnnotatorPlugin } from "../annotationPlugin/AnnotatorPlugin";
import GetAllPages from "./GetAllPages";
import { RootState } from "@/lib/store/store";
import { useDispatch, useSelector } from "react-redux";
import { resetPageComments } from "@/lib/store/comments/commentSlice";
import Hero from "../homepage/hero/Hero";
import USP from "../homepage/usp/USP";
import Services from "../homepage/service/Service";
import Collections from "../homepage/collections/Collections";
import ShopByRoom from "../homepage/shopByRoom/ShopByRoom";
import FeaturedBanner from "../homepage/featuredBanner/FeaturedBanner";
import UpdateCurrentPage from "./UpdateCurrentPage";
import ProductSlider from "../homepage/productSlider/ProductSlider";
import Craft from "../homepage/craft/Craft";
import Testimonials from "../homepage/testimonials/Testimonials";
import Blog from "../homepage/blog/Blog";
import Newsletter from "../homepage/newsletter/Newsletter";
import FAQ from "../homepage/faq/FAQ";
import InstagramGallery from "../homepage/instagram/InstagramGallery";
import GetAuthTokenFastApi from "../wesiteDetail/GetAuthTokenFastApi";

// --- Types ---
interface HomePageProps {
  data: {
    content: any[];
    [key: string]: any;
  };
}

// --- Helper to extract section mapping ---
const getSection = (content: any, adminTitle: string) => 
  Array.isArray(content) ? content.find(s => s?.adminTitle === adminTitle) : undefined;

const HomePage = ({ data }: HomePageProps) => {
  const { nestCraftUser } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { currentPages } = useSelector((state: RootState) => state.pages);
  
  // Ensure content is always an array
  const rawContent = currentPages?.content || data?.content;
  const content = Array.isArray(rawContent) ? rawContent : [];

  useEffect(() => {
    dispatch(resetPageComments());
  }, []);

  const ctaSection = getSection(content, "CTA");
  const ctaBlock = ctaSection?.columns?.[0]?.[0];

  return (
    <>
      {/* commentsS Plugin */}
      {nestCraftUser?.role == "admin" && <AnnotatorPlugin />}

      {/* get all page from the database */}
      <GetAllPages />
      <GetAuthTokenFastApi/>
      <UpdateCurrentPage/>

      <Hero section={getSection(content, "Hero")} />
      <USP />
      <Services section={getSection(content, "Services")} />
      <Collections section={getSection(content, "Collections")} />
      <ShopByRoom />
      <FeaturedBanner section={getSection(content, "FeaturedBanner")} />
      <ProductSlider />
      <Craft section={getSection(content, "Craft")} />
      <Testimonials section={getSection(content, "Testimonials")} />
      <Blog section={getSection(content, "Blog")} />
      <FAQ section={getSection(content, "FAQ")} />
      <Newsletter />
      
      <InstagramGallery />

      {ctaBlock && (
        <section
          data-annotate-id="home-cta-section"
          className="bg-foreground/90 text-surface text-center py-[110px] px-[5%] border-t border-border"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[38px] lg:text-[48px] font-bold tracking-tight">
              {ctaBlock.title}
            </h2>
            <p className="text-white/70 font-semibold mt-[18px] mb-[34px] max-w-[600px] mx-auto">
              {ctaBlock.description}
            </p>
            <div className="flex gap-3.5 justify-center flex-wrap">
              <Link
                href={ctaBlock.buttonLink || "/shop"}
                className="bg-primary text-white px-8 h-12 rounded-full text-[14px] font-semibold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center"
              >
                {ctaBlock.buttonLabel}
              </Link>
              <Link
                href="/contact"
                className="px-8 h-12 rounded-full border border-white/55 text-white text-[14px] font-semibold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center"
              >
                Book a Consultant
              </Link>
            </div>
          </motion.div>
        </section>
      )}
    </>
  );
};

export default HomePage;

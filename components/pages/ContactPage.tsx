"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter, CheckCircle2, ArrowRight, Globe, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AnnotatorPlugin } from '../annotationPlugin/AnnotatorPlugin';
import GetAllPages from './GetAllPages';
import { ContactForm } from '../contactpage/contactForm/ContactForm';
import ContactHero from '../contactpage/contactHero/ContactHero';
import { FAQ } from '../contactpage/faq/FAQ';

const ContactPage = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const { currentPages } = useSelector((state: RootState) => state.pages)


  return (
    <>
      {/* commentsS Plugin */}
      {user?.role == "admin" && <AnnotatorPlugin />}
      {/* get all page from the database */}
      <GetAllPages />
      <div className="pb-20 bg-background">
        {/* Editorial Hero Section */}
        <ContactHero />

        {/* Main Contact Section */}
        <ContactForm />

        {/* FAQ Section */}
        <FAQ />

        {/* Map Section - Minimalist */}
        <section className="px-[5%] max-w-7xl mx-auto pb-32">
          <div className="relative h-[600px] rounded-[60px] overflow-hidden border border-border shadow-2xl group">
            {/* <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000" 
            alt="Map" 
            className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-opacity duration-1000"
          /> */}
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.1622708907225!2d75.82064262512074!3d26.89834471070848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db74615ffdb4d%3A0x21afdb4e447341f4!2sNestCraft%20Living!5e0!3m2!1sen!2sin!4v1776761345663!5m2!1sen!2sin" width="100% " height="100%" loading="lazy" ></iframe>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="bg-surface/80 backdrop-blur-xl p-10 rounded-[40px] border border-border max-w-md shadow-2xl">
                <h4 className="text-2xl font-black mb-4 tracking-tight">Visit the Showroom</h4>
                <p className="text-muted font-semibold mb-6">Experience premium furniture and free design consultations at our Raja Park showroom. Feel the quality of our craftsmanship in person.</p>
                <div className="flex items-center gap-3 text-secondary font-black uppercase tracking-widest text-xs">
                  <Clock size={16} /> Mon - Sat: 10:30 - 9:00
                </div>
              </div>

              <a
                href="https://share.google/UcBYZ8kXdPXVpuhBt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-500"
              >
                <MapPin className="text-primary" size={32} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ContactPage;

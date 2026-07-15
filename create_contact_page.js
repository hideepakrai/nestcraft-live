const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb+srv://deepakr_db_user:4oYOhDfezDMn2jCN@kalpcluster.mr8bacs.mongodb.net/";

async function createContactPage() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("kalp_tenant_furni");
    const pages = db.collection("pages");

    const contactPage = {
      title: "Contact Us",
      slug: "contact",
      isPublished: true,
      metaTitle: "Contact Us - NestCraft",
      metaDescription: "Get in touch with NestCraft furniture design experts in Raja Park, Jaipur.",
      content: [
        {
          id: "contact-hero",
          type: "section",
          adminTitle: "Contact Hero",
          props: {
            subtitle: { en: "Connect with us", hi: "हमसे जुड़ें" },
            headingLine1: { en: "Let's start a", hi: "आइए एक बातचीत" },
            headingLine2: { en: "conversation.", hi: "शुरू करें।" },
            description: { en: "Whether you're looking to transform your home or have a specific inquiry about our collections, our design experts are ready to assist you.", hi: "चाहे आप अपने घर को बदलना चाहते हों या हमारे संग्रह के बारे में कोई विशिष्ट पूछताछ करना चाहते हों, हमारे डिज़ाइन विशेषज्ञ आपकी सहायता के लिए तैयार हैं।" },
            showroomLabel: { en: "Our Signature Showroom", hi: "हमारा सिग्नेचर शोरूम" },
            showroomLocation: { en: "Raja Park, Jaipur", hi: "राजा पार्क, जयपुर" },
            supportLabel: { en: "Support Hours", hi: "समर्थन घंटे" },
            supportHours: { en: "10:30 AM — 9:00 PM", hi: "सुबह 10:30 — रात 9:00" },
            badgeLine1: { en: "Available", hi: "कस्टम" },
            badgeLine2: { en: "for bespoke", "hi": "प्रोजेक्ट्स के" },
            badgeLine3: { en: "projects", hi: "लिए उपलब्ध" },
            bgImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000",
            mainImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1200"
          }
        },
        {
          id: "contact-info-section",
          type: "contact-info",
          adminTitle: "Contact Info",
          props: {
            sectionHeading: { en: "Reach Out", hi: "संपर्क करें" }
          },
          content: [
            {
              props: {
                icon: "Mail",
                label: { en: "Email", hi: "ईमेल" },
                value: { en: "nestcraftmail@gmail.com", hi: "nestcraftmail@gmail.com" },
                href: "mailto:nestcraftmail@gmail.com"
              }
            },
            {
              props: {
                icon: "Phone",
                label: { en: "Phone", hi: "फोन" },
                value: { en: "+91 9810159604", hi: "+91 9810159604" },
                href: "tel:+919810159604"
              }
            },
            {
              props: {
                icon: "MapPin",
                label: { en: "Studio", hi: "स्टूडियो" },
                value: { en: "8A, Excellency Trade Square, Govind Marg, Rajapark Jaipur 302004", hi: "8A, एक्सीलेंसी ट्रेड स्क्वायर, गोविंद मार्ग, राजापार्क जयपुर 302004" }
              }
            }
          ]
        },
        {
          id: "contact-form-section",
          type: "form",
          adminTitle: "Contact Form",
          props: {
            formHeading: { en: "Send an Inquiry", hi: "पूछताछ भेजें" },
            formDescription: { en: "Fill out the form below and we'll get back to you within 24 hours.", hi: "नीचे दिया गया फॉर्म भरें और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।" },
            successHeading: { en: "Message Received", hi: "संदेश प्राप्त हुआ" },
            successDescription: { en: "Thank you for reaching out. A design consultant will contact you shortly to discuss your vision.", hi: "संपर्क करने के लिए धन्यवाद। एक डिज़ाइन सलाहकार जल्द ही आपकी दृष्टि पर चर्चा करने के लिए आपसे संपर्क करेगा।" },
            successButtonText: { en: "Send Another Message", hi: "एक और संदेश भेजें" },
            submitButtonText: { en: "Send Message", hi: "संदेश भेजें" }
          }
        },
        {
          id: "contact-faq",
          type: "section",
          adminTitle: "Contact FAQ",
          props: {
            label: { en: "Common Questions", hi: "सामान्य प्रश्न" },
            heading: { en: "Need a quick answer?", hi: "एक त्वरित उत्तर की आवश्यकता है?" },
            questions: [
              {
                q: { en: "Where is your furniture store located?", hi: "आपके फर्नीचर स्टोर कहाँ स्थित है?" },
                a: { en: "Our premium furniture showroom is located in Raja Park, Jaipur. You are always welcome to visit us, check the quality of our solid wood, and try out our furniture in person before buying.", hi: "हमारा प्रीमियम फर्नीचर शोरूम राजा पार्क, जयपुर में स्थित है। आप हमेशा हमसे मिलने, हमारी ठोस लकड़ी की गुणवत्ता की जांच करने और खरीदने से पहले हमारे फर्नीचर को व्यक्तिगत रूप से आज़माने के लिए स्वागत करते हैं।" }
              },
              {
                q: { en: "Do you deliver furniture outside Jaipur?", hi: "क्या आप जयपुर के बाहर फर्नीचर वितरित करते हैं?" },
                a: { en: "Yes, absolutely! While our main store is in Jaipur, we safely deliver our home furniture all across Rajasthan. Whether you live in Jodhpur, Udaipur, or any other city, we will bring your order right to your doorstep.", hi: "हाँ, बिल्कुल! जबकि हमारा मुख्य स्टोर जयपुर में है, हम पूरे राजस्थान में हमारे घर के फर्नीचर को सुरक्षित रूप से वितरित करते हैं। चाहे आप जोधपुर, उदयपुर, या किसी अन्य शहर में रहते हों, हम आपका ऑर्डर सीधे आपके दरवाजे पर लाएंगे।" }
              },
              {
                q: { en: "Can I get customized furniture for my home?", hi: "क्या मुझे मेरे घर के लिए अनुकूलित फर्नीचर मिल सकता है?" },
                a: { en: "Yes, we love making custom furniture! If you have a specific design, size, or color in mind, just let us know. We will create the perfect sofa, bed, or dining table that fits your home perfectly.", hi: "हाँ, हम कस्टम फर्नीचर बनाना पसंद करते हैं! यदि आपके मन में एक विशिष्ट डिजाइन, आकार, या रंग है, तो बस हमें बताएं। हम एकदम सही सोफा, बिस्तर, या डाइनिंग टेबल बनाएंगे जो आपके घर में पूरी तरह से फिट बैठता है।" }
              },
              {
                q: { en: "What type of wood do you use for your furniture?", hi: "आप अपने फर्नीचर के लिए किस प्रकार की लकड़ी का उपयोग करते हैं?" },
                a: { en: "We mainly use high-quality solid wood, like pure Sheesham and Teak. These woods are very strong, look beautiful, and are naturally perfect for Rajasthan's hot and dry climate.", hi: "हम मुख्य रूप से उच्च गुणवत्ता वाली ठोस लकड़ी का उपयोग करते हैं, जैसे कि शुद्ध शीशम और सागौन। ये लकड़ियाँ बहुत मजबूत होती हैं, सुंदर दिखती हैं, और स्वाभाविक रूप से राजस्थान की गर्म और शुष्क जलवायु के लिए एकदम सही हैं।" }
              },
              {
                q: { en: "Is it safe to buy heavy furniture online from your website?", hi: "क्या आपकी वेबसाइट से ऑनलाइन भारी फर्नीचर खरीदना सुरक्षित है?" },
                a: { en: "Yes, it is 100% safe. We use strong, multi-layer packaging to pack every item. Our trusted delivery team handles heavy solid wood furniture with great care so it reaches your home without a single scratch.", hi: "हाँ, यह 100% सुरक्षित है। हम हर आइटम को पैक करने के लिए मजबूत, बहु-परत पैकेजिंग का उपयोग करते हैं। हमारी विश्वसनीय डिलीवरी टीम भारी ठोस लकड़ी के फर्नीचर को बड़ी सावधानी से संभालती है ताकि यह बिना किसी खरोंच के आपके घर तक पहुंच सके।" }
              },
              {
                q: { en: "How should I clean and take care of my solid wood furniture?", hi: "मुझे अपने ठोस लकड़ी के फर्नीचर को कैसे साफ करना और देखभाल करना चाहिए?" },
                a: { en: "It is very simple. Just wipe your furniture regularly with a soft, dry cloth. To keep the wood looking new for years, try to keep it away from direct sunlight and avoid putting hot mugs directly on the wooden surface.", hi: "यह बहुत आसान है। बस अपने फर्नीचर को नियमित रूप से एक मुलायम, सूखे कपड़े से पोंछें। लकड़ी को वर्षों तक नया दिखने के लिए, इसे सीधे धूप से दूर रखने की कोशिश करें और गर्म मग को सीधे लकड़ी की सतह पर रखने से बचें।" }
              }
            ]
          }
        },
        {
          id: "contact-showroom",
          type: "section",
          adminTitle: "Contact Showroom",
          props: {
            showroomTitle: { en: "Visit the Showroom", hi: "शोरूम पर पधारें" },
            showroomDesc: { en: "Experience premium furniture and free design consultations at our Raja Park showroom. Feel the quality of our craftsmanship in person.", hi: "हमारे राजा पार्क शोरूम में प्रीमियम फर्नीचर और मुफ्त डिजाइन परामर्श का अनुभव करें। हमारी शिल्प कौशल की गुणवत्ता को व्यक्तिगत रूप से महसूस करें।" },
            showroomHours: { en: "Mon - Sat: 10:30 - 9:00", hi: "सोम - शनि: 10:30 - 9:00" },
            mapLink: { en: "https://share.google/UcBYZ8kXdPXVpuhBt", hi: "https://share.google/UcBYZ8kXdPXVpuhBt" }
          }
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await pages.updateOne(
      { slug: "contact" },
      { $set: contactPage },
      { upsert: true }
    );

    console.log("Successfully created/updated Contact page in DB.");
  } catch (error) {
    console.error("Error creating Contact page:", error);
  } finally {
    await client.close();
  }
}

createContactPage();

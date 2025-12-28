
import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Warehouse, Package, FileText, Syringe, HelpCircle, Mail, Phone, Info, Globe } from 'lucide-react';
import { APP_NAME } from '../constants';

interface PublicInfoProps {
  onBack: () => void;
}

export const PublicInfo: React.FC<PublicInfoProps> = ({ onBack }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="home" className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 scroll-smooth">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} title="लगइनमा फर्कनुहोस्" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
               <Warehouse className="text-primary-600" size={28} />
               <h1 className="text-xl font-black font-nepali tracking-tight">{APP_NAME}</h1>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
          >
            लगइन गर्नुहोस्
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        
        {/* Hero Section / About */}
        <section id="about" className="text-center space-y-4 pt-8">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 font-nepali leading-tight">
            आधुनिक र व्यावसायिक <span className="text-primary-600">जिन्सी व्यवस्थापन</span> प्रणाली
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Smart Inventory एउटा अत्याधुनिक क्लाउड-बेस्ड सफ्टवेयर हो जसले सरकारी तथा निजी कार्यालयहरूको जिन्सी चक्र (Inventory Cycle) लाई पूर्णतः डिजिटल बनाउँछ।
          </p>
        </section>

        {/* Feature Grid */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package size={24} />
            </div>
            <h3 className="text-xl font-bold font-nepali mb-3">वस्तुगत नियन्त्रण (Inventory Control)</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              प्रत्येक सामानको प्राप्ति, भण्डारण र निष्कासनको डिजिटल रेकर्ड। खर्च हुने र खर्च नहुने सामानहरूको छुट्टाछुट्टै वर्गीकरण र ASL/EOP मार्फत स्टक नियन्त्रण।
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold font-nepali mb-3">कानुनी फारमहरू (Statutory Forms)</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              म.ले.प. फारम नं. ४०१ (माग फारम), ४०३ (दाखिला प्रतिवेदन), र ४०४ (निकासा प्रतिवेदन) जस्ता कानुनी रूपमा आवश्यक कागजातहरू स्वतः उत्पन्न र प्रिन्ट गर्न सकिन्छ।
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="bg-red-50 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Syringe size={24} />
            </div>
            <h3 className="text-xl font-bold font-nepali mb-3">खोप तथा स्वास्थ्य रेकर्ड</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              रेबिज खोप क्लिनिक व्यवस्थापनको लागि विशेष मोड्युल, जसमा डोजिङ सेड्युल (0, 3, 7 days) र स्वचालित खोप हाजिरी रिपोर्टिङ समावेश छ।
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold font-nepali mb-3">बहु-प्रयोगकर्ता पहुँच</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              भूमिकामा आधारित पहुँच नियन्त्रण (RBAC)। एडमिन, स्टोरकिपर, लेखा र फाँट प्रमुखहरूको लागि छुट्टाछुट्टै अनुमतिहरू र कार्य क्षेत्र।
            </p>
          </div>
        </section>

        {/* Usage Guide Section */}
        <section id="usage" className="bg-indigo-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 scroll-mt-20">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
           <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <HelpCircle size={32} className="text-indigo-300" />
                <h3 className="text-2xl font-bold font-nepali">प्रणाली कसरी प्रयोग गर्ने? (Usage Guide)</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                 <div className="space-y-3">
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">१</div>
                   <h4 className="font-bold font-nepali">लगइन र सेटअप</h4>
                   <p className="text-xs text-indigo-100 opacity-80 leading-relaxed">आफ्नो कार्यालयले उपलब्ध गराएको प्रयोगकर्ता नाम र पासवर्ड प्रयोग गरी लगइन गर्नुहोस्। सुरुमा आफ्नो संस्थाको नाम र आर्थिक वर्ष रुजु गर्नुहोस्।</p>
                 </div>
                 <div className="space-y-3">
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">२</div>
                   <h4 className="font-bold font-nepali">स्टक प्रविष्टि</h4>
                   <p className="text-xs text-indigo-100 opacity-80 leading-relaxed">सामान खरिद गरेपछि वा पुराना सामानको ओपनिङ्ग ब्यालेन्स राख्न 'दाखिला प्रतिवेदन' मोड्युल प्रयोग गर्नुहोस्।</p>
                 </div>
                 <div className="space-y-3">
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">३</div>
                   <h4 className="font-bold font-nepali">माग र निकासा</h4>
                   <p className="text-xs text-indigo-100 opacity-80 leading-relaxed">कुनै शाखालाई सामान आवश्यक परेमा 'माग फारम' भर्नुहोस् र स्टोरकिपरले प्रमाणित गरेपछि 'निकासा प्रतिवेदन' मार्फत सामान हस्तान्तरण गर्नुहोस्।</p>
                 </div>
              </div>
           </div>
        </section>

        {/* AdSense Mandatory Pages Structure */}
        <section id="privacy" className="space-y-8 border-t border-slate-200 pt-16 scroll-mt-20">
          <div className="text-center">
            <h3 className="text-2xl font-bold font-nepali text-slate-800">नियम र नीतिहरू (Policies)</h3>
            <p className="text-sm text-slate-500 mt-2">यो सफ्टवेयर प्रयोग गर्दा लागू हुने नीतिहरू</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-primary-600" /> गोपनीयता नीति (Privacy Policy)
                </h4>
                <p className="text-[13px] text-slate-500 leading-relaxed text-justify">
                   Smart Inventory ले प्रयोगकर्ताहरूको डाटाको सुरक्षालाई उच्च प्राथमिकता दिन्छ। हामीले संकलन गर्ने डाटाहरू केवल जिन्सी व्यवस्थापन प्रयोजनको लागि मात्र प्रयोग गरिन्छ। हामी कुनै पनि तेस्रो पक्षलाई तपाईंको डाटा बिक्री वा साझा गर्दैनौं। सबै डाटाहरू इन्क्रिप्टेड क्लाउड सर्भरमा सुरक्षित राखिन्छ।
                </p>
             </div>
             <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   <Info size={18} className="text-primary-600" /> नियम र सर्तहरू (Terms of Use)
                </h4>
                <p className="text-[13px] text-slate-500 leading-relaxed text-justify">
                   यस सफ्टवेयरको प्रयोग केवल अधिकृत कर्मचारीहरूले मात्र गर्न पाउनेछन्। पासवर्डको सुरक्षा र प्रयोगकर्ताको गतिविधिको जिम्मेवारी स्वयम् प्रयोगकर्ताको हुनेछ। प्रणालीको दुरुपयोग गरिएको पाइएमा पहुँच बन्द गरिनेछ।
                </p>
             </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-slate-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 scroll-mt-20">
           <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full text-primary-600 shadow-sm">
                 <Mail size={24} />
              </div>
              <div>
                 <h4 className="font-bold font-nepali">सम्पर्क र सहयोग</h4>
                 <p className="text-xs text-slate-500 mt-1">कुनै जिज्ञासा वा समस्या भएमा सम्पर्क गर्नुहोस्</p>
              </div>
           </div>
           <div className="flex gap-4">
              <a href="mailto:support@smartinventory.com" className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Mail size={16} /> Support Email
              </a>
              <a href="tel:+97701XXXXXXX" className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Phone size={16} /> Contact Us
              </a>
           </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                 <Warehouse className="text-slate-400" size={24} />
                 <span className="text-lg font-black text-slate-800">{APP_NAME}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                 © {new Date().getFullYear()} Smart Inventory Management. All Rights Reserved. <br/>
                 Developed with ❤️ in Nepal.
              </p>
           </div>
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary-600 transition-colors">Home</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-primary-600 transition-colors">About</button>
              <button onClick={() => scrollToSection('usage')} className="hover:text-primary-600 transition-colors">Usage Guide</button>
              <button onClick={() => scrollToSection('privacy')} className="hover:text-primary-600 transition-colors">Privacy</button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-primary-600 transition-colors">Contact</button>
           </div>
        </div>
      </footer>
    </div>
  );
};

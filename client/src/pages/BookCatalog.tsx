import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Search, ShoppingCart, BookOpen, Star, Filter, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// ─── LIOTA Book Catalog ────────────────────────────────────────────────────────
const LIOTA_BOOKS = [
  // ESL Series (20 books)
  { id: 1, title: "English Foundations A1", series: "ESL", level: "A1", type: "Textbook", price: 24.99, lang: "English", description: "Complete beginner English with audio and exercises." },
  { id: 2, title: "English Foundations A1 Workbook", series: "ESL", level: "A1", type: "Workbook", price: 14.99, lang: "English", description: "Practice workbook for A1 level learners." },
  { id: 3, title: "English Foundations A2", series: "ESL", level: "A2", type: "Textbook", price: 24.99, lang: "English", description: "Elementary English for everyday communication." },
  { id: 4, title: "English Foundations A2 Workbook", series: "ESL", level: "A2", type: "Workbook", price: 14.99, lang: "English", description: "Practice workbook for A2 level learners." },
  { id: 5, title: "English Intermediate B1", series: "ESL", level: "B1", type: "Textbook", price: 27.99, lang: "English", description: "Build confidence and fluency at intermediate level." },
  { id: 6, title: "English Intermediate B1 Workbook", series: "ESL", level: "B1", type: "Workbook", price: 16.99, lang: "English", description: "Structured practice for B1 learners." },
  { id: 7, title: "English Upper-Intermediate B2", series: "ESL", level: "B2", type: "Textbook", price: 29.99, lang: "English", description: "Advanced grammar and complex communication skills." },
  { id: 8, title: "English Upper-Intermediate B2 Workbook", series: "ESL", level: "B2", type: "Workbook", price: 18.99, lang: "English", description: "Intensive practice for B2 level." },
  { id: 9, title: "English Advanced C1", series: "ESL", level: "C1", type: "Textbook", price: 32.99, lang: "English", description: "Academic and professional English mastery." },
  { id: 10, title: "English Advanced C1 Workbook", series: "ESL", level: "C1", type: "Workbook", price: 19.99, lang: "English", description: "Advanced exercises for C1 level." },
  { id: 11, title: "English Proficiency C2", series: "ESL", level: "C2", type: "Textbook", price: 34.99, lang: "English", description: "Near-native English proficiency guide." },
  { id: 12, title: "English Conversation Practice A1–B1", series: "ESL", level: "A1–B1", type: "Conversation", price: 19.99, lang: "English", description: "Guided dialogues and role-play scenarios." },
  { id: 13, title: "English Conversation Practice B1–C1", series: "ESL", level: "B1–C1", type: "Conversation", price: 21.99, lang: "English", description: "Advanced conversation and debate skills." },
  { id: 14, title: "English Grammar in Action", series: "ESL", level: "A2–B2", type: "Grammar", price: 22.99, lang: "English", description: "Comprehensive grammar reference with exercises." },
  { id: 15, title: "English for Children Ages 5–8", series: "ESL Kids", level: "Pre-A1", type: "Textbook", price: 19.99, lang: "English", description: "Fun and colorful beginner English for young learners." },
  { id: 16, title: "English for Children Ages 9–12", series: "ESL Kids", level: "A1–A2", type: "Textbook", price: 21.99, lang: "English", description: "Interactive English for upper elementary students." },
  { id: 17, title: "English for Teens", series: "ESL Teens", level: "A2–B2", type: "Textbook", price: 25.99, lang: "English", description: "Engaging English for teenagers with modern topics." },
  { id: 18, title: "Business English Essentials", series: "Business", level: "B1–B2", type: "Textbook", price: 34.99, lang: "English", description: "Professional communication for the workplace." },
  { id: 19, title: "Business English Advanced", series: "Business", level: "C1", type: "Textbook", price: 36.99, lang: "English", description: "Executive-level English for negotiations and leadership." },
  { id: 20, title: "English Pronunciation Guide", series: "ESL", level: "A1–C1", type: "Reference", price: 17.99, lang: "English", description: "Master English sounds, stress, and intonation." },
  // SSL Series (15 books)
  { id: 21, title: "Spanish Foundations A1", series: "SSL", level: "A1", type: "Textbook", price: 24.99, lang: "Spanish", description: "Complete beginner Spanish for English speakers." },
  { id: 22, title: "Spanish Foundations A1 Workbook", series: "SSL", level: "A1", type: "Workbook", price: 14.99, lang: "Spanish", description: "Practice workbook for beginner Spanish." },
  { id: 23, title: "Spanish Foundations A2", series: "SSL", level: "A2", type: "Textbook", price: 24.99, lang: "Spanish", description: "Elementary Spanish for everyday situations." },
  { id: 24, title: "Spanish Intermediate B1", series: "SSL", level: "B1", type: "Textbook", price: 27.99, lang: "Spanish", description: "Build fluency and confidence in Spanish." },
  { id: 25, title: "Spanish Intermediate B1 Workbook", series: "SSL", level: "B1", type: "Workbook", price: 16.99, lang: "Spanish", description: "Structured practice for B1 Spanish." },
  { id: 26, title: "Spanish Upper-Intermediate B2", series: "SSL", level: "B2", type: "Textbook", price: 29.99, lang: "Spanish", description: "Advanced Spanish grammar and communication." },
  { id: 27, title: "Spanish Advanced C1", series: "SSL", level: "C1", type: "Textbook", price: 32.99, lang: "Spanish", description: "Near-native Spanish for professionals." },
  { id: 28, title: "Spanish for Latin America", series: "SSL", level: "A1–B2", type: "Textbook", price: 26.99, lang: "Spanish", description: "Latin American Spanish with regional vocabulary." },
  { id: 29, title: "Spanish Conversation Practice", series: "SSL", level: "A2–B2", type: "Conversation", price: 19.99, lang: "Spanish", description: "Real-world dialogues and conversation practice." },
  { id: 30, title: "Spanish Grammar in Action", series: "SSL", level: "A2–B2", type: "Grammar", price: 22.99, lang: "Spanish", description: "Comprehensive Spanish grammar reference." },
  { id: 31, title: "Spanish for Business", series: "Business", level: "B1–C1", type: "Textbook", price: 34.99, lang: "Spanish", description: "Professional Spanish for corporate environments." },
  { id: 32, title: "Spanish for Children", series: "SSL Kids", level: "Pre-A1–A2", type: "Textbook", price: 19.99, lang: "Spanish", description: "Fun Spanish for young learners." },
  { id: 33, title: "Spanish for Travel in Mexico", series: "SSL", level: "A1–B1", type: "Reference", price: 16.99, lang: "Spanish", description: "Essential Spanish phrases for traveling in Mexico." },
  { id: 34, title: "Spanish Pronunciation & Accent Guide", series: "SSL", level: "A1–C1", type: "Reference", price: 17.99, lang: "Spanish", description: "Master Spanish sounds and regional accents." },
  { id: 35, title: "Spanish Vocabulary Builder", series: "SSL", level: "A1–B2", type: "Reference", price: 15.99, lang: "Spanish", description: "2,000 essential Spanish words with examples." },
  // Polyglot Series (10 books)
  { id: 36, title: "Polyglot Method: Introduction", series: "Polyglot", level: "All", type: "Textbook", price: 29.99, lang: "Multi", description: "The LIOTA multi-language learning methodology." },
  { id: 37, title: "French Foundations A1", series: "Polyglot", level: "A1", type: "Textbook", price: 24.99, lang: "French", description: "Beginner French for polyglot learners." },
  { id: 38, title: "French Intermediate B1", series: "Polyglot", level: "B1", type: "Textbook", price: 27.99, lang: "French", description: "Intermediate French with cultural immersion." },
  { id: 39, title: "Portuguese Foundations A1", series: "Polyglot", level: "A1", type: "Textbook", price: 24.99, lang: "Portuguese", description: "Beginner Brazilian Portuguese." },
  { id: 40, title: "Portuguese Intermediate B1", series: "Polyglot", level: "B1", type: "Textbook", price: 27.99, lang: "Portuguese", description: "Intermediate Portuguese for travelers and professionals." },
  { id: 41, title: "German Foundations A1", series: "Polyglot", level: "A1", type: "Textbook", price: 24.99, lang: "German", description: "Beginner German for the Vienna campus." },
  { id: 42, title: "German Intermediate B1", series: "Polyglot", level: "B1", type: "Textbook", price: 27.99, lang: "German", description: "Intermediate German with Austrian context." },
  { id: 43, title: "Language Learning Strategies", series: "Polyglot", level: "All", type: "Reference", price: 19.99, lang: "Multi", description: "Science-backed techniques for faster language acquisition." },
  { id: 44, title: "Multilingual Vocabulary Builder", series: "Polyglot", level: "A1–B1", type: "Reference", price: 21.99, lang: "Multi", description: "Core vocabulary in 5 languages side by side." },
  { id: 45, title: "The LIOTA Polyglot Journal", series: "Polyglot", level: "All", type: "Workbook", price: 12.99, lang: "Multi", description: "Structured daily practice journal for language learners." },
  // STEAM Series (8 books)
  { id: 46, title: "STEAM English: Science & Language A1", series: "STEAM", level: "A1–A2", type: "Textbook", price: 26.99, lang: "English", description: "Learn English through science experiments and projects." },
  { id: 47, title: "STEAM English: Technology & Language B1", series: "STEAM", level: "B1", type: "Textbook", price: 28.99, lang: "English", description: "Technology vocabulary and project-based English." },
  { id: 48, title: "STEAM English: Math & Language A2", series: "STEAM", level: "A2", type: "Textbook", price: 26.99, lang: "English", description: "Mathematical English and problem-solving language." },
  { id: 49, title: "STEAM Spanish: Science & Language", series: "STEAM", level: "A1–B1", type: "Textbook", price: 26.99, lang: "Spanish", description: "Learn Spanish through STEM activities." },
  { id: 50, title: "STEAM for Young Learners Ages 5–8", series: "STEAM Kids", level: "Pre-A1", type: "Textbook", price: 22.99, lang: "Multi", description: "Bilingual STEAM activities for young children." },
  { id: 51, title: "STEAM for Tweens Ages 9–12", series: "STEAM Kids", level: "A1–A2", type: "Textbook", price: 24.99, lang: "Multi", description: "Hands-on STEAM projects with bilingual instruction." },
  { id: 52, title: "STEAM for Teens Ages 13–17", series: "STEAM Teens", level: "A2–B2", type: "Textbook", price: 27.99, lang: "Multi", description: "Advanced STEAM projects with academic language." },
  { id: 53, title: "STEAM Teacher's Resource Guide", series: "STEAM", level: "All", type: "Reference", price: 39.99, lang: "Multi", description: "Instructor guide for STEAM language integration." },
  // Study Abroad & Cultural Series (7 books)
  { id: 54, title: "Study Abroad Survival Guide: Mexico", series: "Study Abroad", level: "All", type: "Reference", price: 18.99, lang: "English", description: "Essential guide for studying in Mérida, Mexico." },
  { id: 55, title: "Study Abroad Survival Guide: USA", series: "Study Abroad", level: "All", type: "Reference", price: 18.99, lang: "English", description: "Guide for studying in Dallas and Denver." },
  { id: 56, title: "Study Abroad Survival Guide: UK", series: "Study Abroad", level: "All", type: "Reference", price: 18.99, lang: "English", description: "Guide for studying in Nottingham, England." },
  { id: 57, title: "Study Abroad Survival Guide: Austria", series: "Study Abroad", level: "All", type: "Reference", price: 18.99, lang: "English", description: "Guide for studying in Vienna, Austria." },
  { id: 58, title: "Cultural Intelligence for Language Learners", series: "Cultural", level: "All", type: "Reference", price: 22.99, lang: "Multi", description: "Understanding culture for effective communication." },
  { id: 59, title: "Passport to Language: Travel Phrasebook", series: "Cultural", level: "A1–B1", type: "Reference", price: 14.99, lang: "Multi", description: "Essential phrases in 6 languages for travelers." },
  { id: 60, title: "The LIOTA Method: Complete Guide", series: "LIOTA", level: "All", type: "Reference", price: 29.99, lang: "Multi", description: "The complete LIOTA Institute language learning philosophy and methodology." },
];

const SERIES_COLORS: Record<string, string> = {
  ESL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "ESL Kids": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "ESL Teens": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  SSL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "SSL Kids": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  Polyglot: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  STEAM: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "STEAM Kids": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "STEAM Teens": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "Study Abroad": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Cultural: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Business: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  LIOTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const TYPE_ICONS: Record<string, string> = {
  Textbook: "📘",
  Workbook: "📝",
  Grammar: "📐",
  Conversation: "💬",
  Reference: "📖",
};

export default function BookCatalog() {
  const [search, setSearch] = useState("");
  const [filterSeries, setFilterSeries] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterLang, setFilterLang] = useState("all");
  const [cart, setCart] = useState<number[]>([]);

  const allSeries = Array.from(new Set(LIOTA_BOOKS.map((b) => b.series)));
  const allTypes = Array.from(new Set(LIOTA_BOOKS.map((b) => b.type)));
  const allLangs = Array.from(new Set(LIOTA_BOOKS.map((b) => b.lang)));

  const filtered = LIOTA_BOOKS.filter((b) => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeries !== "all" && b.series !== filterSeries) return false;
    if (filterType !== "all" && b.type !== filterType) return false;
    if (filterLang !== "all" && b.lang !== filterLang) return false;
    return true;
  });

  const addToCart = (id: number) => {
    setCart((prev) => prev.includes(id) ? prev : [...prev, id]);
    toast.success("Added to cart");
  };

  const cartTotal = cart.reduce((sum, id) => {
    const book = LIOTA_BOOKS.find((b) => b.id === id);
    return sum + (book?.price ?? 0);
  }, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" /> LIOTA Book Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {LIOTA_BOOKS.length} language learning books — ESL, SSL, Polyglot, STEAM, Study Abroad
          </p>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{cart.length} books · ${cartTotal.toFixed(2)}</span>
            <Button size="sm" className="h-7 text-xs" onClick={() => toast.info("Checkout coming soon")}>
              Checkout
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Books", value: "60", icon: "📚", color: "text-blue-600" },
          { label: "ESL Series", value: "20", icon: "🇺🇸", color: "text-emerald-600" },
          { label: "SSL Series", value: "15", icon: "🇲🇽", color: "text-amber-600" },
          { label: "Polyglot & More", value: "25", icon: "🌍", color: "text-violet-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterSeries} onValueChange={setFilterSeries}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Series" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {allSeries.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {allTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Languages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {allLangs.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-1">{filtered.length} books</span>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((book) => (
          <Card key={book.id} className="border border-border hover:shadow-md transition-shadow flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-2xl">{TYPE_ICONS[book.type] ?? "📗"}</span>
                <Badge className={`text-[10px] px-1.5 py-0 h-5 ${SERIES_COLORS[book.series] ?? "bg-gray-100 text-gray-700"}`}>
                  {book.series}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">{book.title}</h3>
              <p className="text-xs text-muted-foreground flex-1 mb-3">{book.description}</p>
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 h-5">{book.level}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 h-5">{book.type}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                  <Globe className="w-2.5 h-2.5 mr-0.5" />{book.lang}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-base font-bold text-primary">${book.price.toFixed(2)}</span>
                <Button
                  size="sm"
                  variant={cart.includes(book.id) ? "secondary" : "default"}
                  className="h-7 text-xs gap-1"
                  onClick={() => addToCart(book.id)}
                >
                  <ShoppingCart className="w-3 h-3" />
                  {cart.includes(book.id) ? "Added" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No books match your filters</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(""); setFilterSeries("all"); setFilterType("all"); setFilterLang("all"); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Purchase info */}
      <Card className="border border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">Order Books for Students</p>
              <p className="text-xs text-muted-foreground mt-1">
                Books are available for purchase online at{" "}
                <a href="https://languageinstituteoftheamericas.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  languageinstituteoftheamericas.com <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and at all LIOTA campus bookstores (Mérida, Dallas, Denver, Vienna, Nottingham). Bulk discounts available for enrolled students.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plane, MapPin, Clock, DollarSign, Globe, BookOpen, Home, Users,
  CheckCircle, Star, Calendar, ArrowRight, ExternalLink, Info
} from "lucide-react";
import { toast } from "sonner";

// ─── Campus Data ──────────────────────────────────────────────────────────────
const CAMPUSES = [
  {
    id: "merida",
    name: "Mérida, Mexico",
    flag: "🇲🇽",
    currency: "USD",
    price: 1500,
    priceLabel: "$1,500 USD",
    duration: "3 months",
    language: "Spanish / English",
    timezone: "CST (UTC-6)",
    climate: "Tropical, warm year-round",
    highlights: [
      "Immersive Spanish & English environment",
      "Colonial city with rich Mayan culture",
      "Most affordable cost of living",
      "Gateway to Yucatán Peninsula",
      "LIOTA headquarters campus",
    ],
    programs: ["ESL", "SSL", "Polyglot", "STEAM", "Business English"],
    housing: "Shared apartments near campus, host families available",
    included: ["Language classes (20 hrs/week)", "Housing assistance", "Cultural activities", "Airport pickup", "Student ID card", "Library access"],
    passportDestinations: ["Mexico City", "Cancún", "Chichén Itzá", "Tulum", "Oaxaca"],
    image: "🏛️",
  },
  {
    id: "dallas",
    name: "Dallas, Texas, USA",
    flag: "🇺🇸",
    currency: "USD",
    price: 1500,
    priceLabel: "$1,500 USD",
    duration: "3 months",
    language: "English / Spanish",
    timezone: "CST (UTC-6)",
    climate: "Hot summers, mild winters",
    highlights: [
      "Major US metropolitan experience",
      "Large Hispanic community for SSL practice",
      "Business English focus",
      "Modern campus facilities",
      "Internship opportunities available",
    ],
    programs: ["ESL", "SSL", "Business English", "Polyglot"],
    housing: "Student residence halls and shared apartments",
    included: ["Language classes (20 hrs/week)", "Housing assistance", "Cultural activities", "Airport pickup", "Student ID card", "Library access"],
    passportDestinations: ["Austin", "San Antonio", "Houston", "New Orleans", "Washington D.C."],
    image: "🌆",
  },
  {
    id: "denver",
    name: "Denver, Colorado, USA",
    flag: "🇺🇸",
    currency: "USD",
    price: 1500,
    priceLabel: "$1,500 USD",
    duration: "3 months",
    language: "English",
    timezone: "MST (UTC-7)",
    climate: "Four seasons, 300 sunny days/year",
    highlights: [
      "Rocky Mountain outdoor lifestyle",
      "Growing tech and startup scene",
      "Diverse multicultural community",
      "Outdoor adventure activities",
      "STEAM program specialty campus",
    ],
    programs: ["ESL", "STEAM", "Business English", "Polyglot"],
    housing: "Shared apartments and homestay options",
    included: ["Language classes (20 hrs/week)", "Housing assistance", "Cultural activities", "Airport pickup", "Student ID card", "Library access"],
    passportDestinations: ["Rocky Mountain National Park", "Colorado Springs", "Aspen", "Santa Fe", "Las Vegas"],
    image: "🏔️",
  },
  {
    id: "vienna",
    name: "Vienna, Austria",
    flag: "🇦🇹",
    currency: "EUR",
    price: 1500,
    priceLabel: "€1,500 EUR",
    duration: "3 months",
    language: "German / English",
    timezone: "CET (UTC+1)",
    climate: "Continental, warm summers, cold winters",
    highlights: [
      "UNESCO World Heritage city",
      "European cultural capital",
      "German language immersion",
      "World-class music and arts scene",
      "Gateway to Central Europe travel",
    ],
    programs: ["ESL", "German (SSL)", "Polyglot", "Business English"],
    housing: "Student dormitories and shared flats (Wohngemeinschaft)",
    included: ["Language classes (20 hrs/week)", "Housing assistance", "Cultural activities", "Airport pickup", "Student ID card", "Library access", "Vienna transit pass"],
    passportDestinations: ["Prague", "Budapest", "Bratislava", "Salzburg", "Munich"],
    image: "🎼",
  },
  {
    id: "nottingham",
    name: "Nottingham, England, UK",
    flag: "🇬🇧",
    currency: "GBP",
    price: 1500,
    priceLabel: "£1,500 GBP",
    duration: "3 months",
    language: "English (British)",
    timezone: "GMT (UTC+0)",
    climate: "Temperate, mild and rainy",
    highlights: [
      "Historic English city (Robin Hood country)",
      "British English accent and culture",
      "Two major universities nearby",
      "Central England location for travel",
      "Vibrant student community",
    ],
    programs: ["ESL", "Business English", "Polyglot"],
    housing: "Student halls and shared houses",
    included: ["Language classes (20 hrs/week)", "Housing assistance", "Cultural activities", "Airport pickup", "Student ID card", "Library access", "UK SIM card"],
    passportDestinations: ["London", "Edinburgh", "Manchester", "Oxford", "Cambridge", "Paris"],
    image: "🏰",
  },
];

// ─── Travel Passport Program ──────────────────────────────────────────────────
const PASSPORT_TRIPS = [
  { from: "Mérida", to: "Mexico City", duration: "4 days", transport: "Flight", cost: "Included", description: "Explore the capital, museums, and Aztec history." },
  { from: "Mérida", to: "Cancún & Tulum", duration: "3 days", transport: "Bus", cost: "Included", description: "Caribbean beaches and Mayan ruins." },
  { from: "Dallas", to: "Mexico City", duration: "4 days", transport: "Flight", cost: "Included", description: "Cross-border cultural immersion experience." },
  { from: "Denver", to: "Rocky Mountains", duration: "2 days", transport: "Bus", cost: "Included", description: "National park adventure with guided tours." },
  { from: "Vienna", to: "Prague", duration: "3 days", transport: "Train", cost: "Included", description: "Czech capital with stunning medieval architecture." },
  { from: "Vienna", to: "Budapest", duration: "2 days", transport: "Train", cost: "Included", description: "Hungarian capital on the Danube River." },
  { from: "Nottingham", to: "London", duration: "3 days", transport: "Train", cost: "Included", description: "British capital: Big Ben, museums, theatre." },
  { from: "Nottingham", to: "Edinburgh", duration: "3 days", transport: "Train", cost: "Included", description: "Scottish capital with castle and highland culture." },
];

export default function StudyAbroad() {
  const [selectedCampus, setSelectedCampus] = useState<typeof CAMPUSES[0] | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyCampus, setApplyCampus] = useState<typeof CAMPUSES[0] | null>(null);

  const handleApply = (campus: typeof CAMPUSES[0]) => {
    setApplyCampus(campus);
    setApplyOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Plane className="w-6 h-6 text-primary" /> Study Abroad & Residency Programs
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          3-month immersive language residency programs with passport travel — 5 campuses worldwide
        </p>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">🌍 LIOTA Residency Program</h2>
            <p className="text-blue-100 text-sm max-w-xl">
              Live, study, and travel abroad for 3 months. Includes language classes (20 hrs/week), housing assistance,
              cultural immersion activities, and guided passport trips to neighboring countries.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm bg-white/20 rounded-lg px-3 py-1.5">
                <Clock className="w-4 h-4" /> 3 Months
              </div>
              <div className="flex items-center gap-1.5 text-sm bg-white/20 rounded-lg px-3 py-1.5">
                <BookOpen className="w-4 h-4" /> 20 hrs/week
              </div>
              <div className="flex items-center gap-1.5 text-sm bg-white/20 rounded-lg px-3 py-1.5">
                <Globe className="w-4 h-4" /> 5 Campuses
              </div>
              <div className="flex items-center gap-1.5 text-sm bg-white/20 rounded-lg px-3 py-1.5">
                <Plane className="w-4 h-4" /> Passport Trips Included
              </div>
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-4xl font-bold">$1,500</p>
            <p className="text-blue-200 text-sm">USD / £ / €</p>
            <p className="text-blue-200 text-xs mt-0.5">per residency</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="campuses">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campuses" className="gap-2">
            <MapPin className="w-4 h-4" /> Campuses
          </TabsTrigger>
          <TabsTrigger value="passport" className="gap-2">
            <Globe className="w-4 h-4" /> Passport Trips
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" /> Pricing & Enrollment
          </TabsTrigger>
        </TabsList>

        {/* Campuses Tab */}
        <TabsContent value="campuses" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CAMPUSES.map((campus) => (
              <Card key={campus.id} className="border border-border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCampus(campus)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{campus.image}</span>
                      <span className="text-2xl">{campus.flag}</span>
                    </div>
                    <Badge className="text-xs bg-primary/10 text-primary border-0">{campus.priceLabel}</Badge>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{campus.name}</h3>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3" /> {campus.language}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {campus.duration} · {campus.timezone}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {campus.climate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {campus.programs.slice(0, 3).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px] px-1.5 h-5">{p}</Badge>
                    ))}
                    {campus.programs.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 h-5">+{campus.programs.length - 3}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedCampus(campus); }}>
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); handleApply(campus); }}>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Passport Trips Tab */}
        <TabsContent value="passport" className="mt-4">
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">LIOTA Passport Program</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Every residency includes guided passport trips to neighboring cities and countries. These trips are
                    organized by LIOTA staff and are designed to enhance cultural immersion and language practice in real-world settings.
                    Travel costs are included in the residency fee.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PASSPORT_TRIPS.map((trip, i) => (
                <Card key={i} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{trip.from}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{trip.to}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{trip.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />{trip.duration}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 h-5">{trip.transport}</Badge>
                          <Badge className="text-[10px] px-1.5 h-5 bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />{trip.cost}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { campuses: "Mérida · Dallas · Denver", currency: "USD", price: "$1,500", flag: "🇲🇽🇺🇸" },
                { campuses: "Nottingham, England", currency: "GBP", price: "£1,500", flag: "🇬🇧" },
                { campuses: "Vienna, Austria", currency: "EUR", price: "€1,500", flag: "🇦🇹" },
              ].map((pricing) => (
                <Card key={pricing.currency} className="border border-border text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl mb-2">{pricing.flag}</div>
                    <p className="text-3xl font-bold text-primary mb-1">{pricing.price}</p>
                    <p className="text-xs text-muted-foreground mb-2">{pricing.currency} per 3-month residency</p>
                    <p className="text-sm font-medium text-foreground">{pricing.campuses}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What's Included in Every Residency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Language classes — 20 hours per week",
                    "Housing assistance (shared apartments or homestay)",
                    "Airport pickup on arrival",
                    "Cultural immersion activities",
                    "Guided passport trips to neighboring countries",
                    "LIOTA student ID card",
                    "Campus library and resource access",
                    "CEFR placement test and final assessment",
                    "Certificate of completion",
                    "WhatsApp support group with staff",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Enrollment Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Choose Your Campus", desc: "Select the campus and program that fits your goals." },
                    { step: 2, title: "Submit Application", desc: "Fill out the online application form with your details." },
                    { step: 3, title: "CEFR Placement Test", desc: "Complete a free online placement test to determine your level." },
                    { step: 4, title: "Confirm & Pay", desc: "Pay the $1,500 / £1,500 / €1,500 residency fee to confirm your spot." },
                    { step: 5, title: "Pre-Departure Briefing", desc: "Attend a virtual orientation with LIOTA staff." },
                    { step: 6, title: "Arrive & Begin", desc: "Arrive at your campus and start your immersive journey!" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="gap-2" onClick={() => toast.info("Application form coming soon — contact admin@languageinstituteoftheamericas.com")}>
                    <Plane className="w-4 h-4" /> Apply for Residency
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => window.open("https://languageinstituteoftheamericas.com", "_blank")}>
                    <ExternalLink className="w-4 h-4" /> Visit Website
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Campus Detail Dialog */}
      <Dialog open={!!selectedCampus} onOpenChange={(o) => { if (!o) setSelectedCampus(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCampus && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCampus.image}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedCampus.flag}</span>
                      <span className="font-bold text-lg">{selectedCampus.name}</span>
                    </div>
                    <Badge className="text-xs bg-primary/10 text-primary border-0 mt-1">{selectedCampus.priceLabel} · {selectedCampus.duration}</Badge>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Language</p>
                    <p className="font-medium">{selectedCampus.language}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Timezone</p>
                    <p className="font-medium">{selectedCampus.timezone}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Climate</p>
                    <p className="font-medium">{selectedCampus.climate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Highlights</p>
                  <ul className="space-y-1">
                    {selectedCampus.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Programs Available</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCampus.programs.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">What's Included</p>
                  <ul className="space-y-1">
                    {selectedCampus.included.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Passport Destinations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCampus.passportDestinations.map((d) => (
                      <Badge key={d} className="text-xs bg-blue-100 text-blue-700 border-0">
                        <Plane className="w-2.5 h-2.5 mr-1" />{d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Housing</p>
                  <p className="text-sm">{selectedCampus.housing}</p>
                </div>
                <Button className="w-full gap-2" onClick={() => { setSelectedCampus(null); handleApply(selectedCampus); }}>
                  <Plane className="w-4 h-4" /> Apply for {selectedCampus.name}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{applyCampus?.flag}</span>
              <span>Apply: {applyCampus?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Residency Fee: {applyCampus?.priceLabel}</p>
              <p className="text-blue-700 dark:text-blue-400 text-xs">
                To apply for the {applyCampus?.name} residency program, please contact the LIOTA admissions team.
                They will guide you through the application, placement test, and payment process.
              </p>
            </div>
            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => { toast.success("Application request sent! Admissions team will contact you."); setApplyOpen(false); }}>
                <CheckCircle className="w-4 h-4" /> Request Application
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => window.open("https://languageinstituteoftheamericas.com", "_blank")}>
                <ExternalLink className="w-4 h-4" /> Visit LIOTA Website
              </Button>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => window.open("mailto:admin@languageinstituteoftheamericas.com")}>
                admin@languageinstituteoftheamericas.com
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

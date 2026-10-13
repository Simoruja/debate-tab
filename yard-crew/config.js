/*
 * ============================================================
 *  YARD CREW SITE CONFIG — this is the only file you need to edit
 * ============================================================
 *
 * - Change your business name, contact info and service area below.
 * - Every price on the site (cards, comparison table, quote estimator)
 *   is generated from the `services` list, so update prices here only.
 * - To turn on a season (e.g. winter snow shoveling), set
 *   `active: true` on that season. Inactive seasons still show their
 *   services but marked "Coming soon", and bookings become a waitlist.
 * - To add a brand-new service, copy one of the entries in `services`
 *   and change the id, name, season and pricing.
 *
 * Pricing types:
 *   tiered  -> customer picks a size (yard, driveway...). `tiers` list.
 *   hourly  -> `rate` per crew member per hour, `minCrewHours` minimum.
 *   perUnit -> `rate` per `unit` (bag, cubic yard...), `minUnits` minimum.
 *
 * `extras` are optional add-ons. Use `price` for a flat amount or
 * `percent` for a surcharge on the base price.
 *
 * `proRange` / `proNote` describe typical professional pricing so the
 * site can show customers how much they save. Sources are in README.md.
 */
window.YARD_CREW_CONFIG = {
  business: {
    name: "Campus Yard Crew",
    tagline: "College students. Real work ethic. Fair prices.",
    pitch:
      "We're a crew of local college students who rake, mow, clean up and shovel so you don't have to. Same quality as the big companies, without the big-company price tag.",
    city: "Your Town",
    serviceArea: ["Downtown", "University Heights", "Northside", "Maple Grove"],
    phone: "(857) 234-9243",
    email: "rahard@bc.edu",
    instagram: "", // e.g. "campusyardcrew" (leave blank to hide)
    crew: [
      { name: "Alex", role: "Scheduling & quotes" },
      { name: "Jordan", role: "Crew lead" },
      { name: "Sam", role: "Equipment & logistics" },
      { name: "Taylor", role: "Customer follow-up" },
    ],
    // Where booking requests are sent. FormSubmit (https://formsubmit.co)
    // emails every request to the address at the end of this URL, with no
    // account needed. The very first request triggers a one-time activation
    // email to that inbox; click the link in it and requests start arriving.
    // A Formspree URL (https://formspree.io/f/...) works here too. If left
    // blank, customers get a copyable request to text or email you instead.
    formEndpoint: "https://formsubmit.co/ajax/rahard@bc.edu",
  },

  // Months are 1-12. The site opens on the season that matches today's date.
  seasons: [
    { id: "fall", label: "Fall", icon: "🍂", months: [9, 10, 11], active: true },
    { id: "spring", label: "Spring & Summer", icon: "🌱", months: [3, 4, 5, 6, 7, 8], active: true },
    {
      id: "winter",
      label: "Winter",
      icon: "❄️",
      months: [12, 1, 2],
      active: false, // flip to true when the crew is ready to shovel
      comingSoonNote: "Snow shoveling launches this winter. Join the snow list and you'll be first on our route.",
    },
  ],

  // Applied when the customer ticks "recurring" in the estimator.
  recurringDiscountPercent: 10,

  services: [
    // ---------------------------- FALL ----------------------------
    {
      id: "leaf-raking",
      seasons: ["fall"],
      name: "Leaf Raking & Bagging",
      featured: true,
      description:
        "We rake lawns and beds, blow leaves off the driveway and walks, and bag everything for curbside pickup.",
      pricing: {
        type: "tiered",
        unit: "per visit",
        tiers: [
          { label: "Small yard (townhouse, up to ~⅛ acre)", price: 75 },
          { label: "Medium yard (typical lot, ~¼ acre)", price: 120 },
          { label: "Large yard (~½ acre)", price: 195 },
        ],
        overNote: "Over ½ acre or very heavy leaf cover? Ask for a free quote.",
      },
      extras: [
        { id: "haul", label: "Haul bags away for you (per bag)", price: 5, perUnit: "bag" },
      ],
      recurring: "every 2 weeks during leaf season",
      proRange: "$160–$290",
      proNote: "for a ¼-acre yard",
    },
    {
      id: "yard-cleanup",
      seasons: ["fall", "spring"],
      name: "Yard Cleanup",
      description:
        "Seasonal cleanup: clear sticks and debris, weed and edge beds, cut back plants, and leave the yard looking sharp.",
      pricing: {
        type: "hourly",
        rate: 25,
        unit: "per crew member / hour",
        minCrewHours: 2,
        defaultCrew: 2,
        defaultHours: 2,
      },
      proRange: "$40–$80",
      proNote: "per hour",
    },

    // ----------------------- SPRING & SUMMER -----------------------
    {
      id: "mowing",
      seasons: ["spring"],
      name: "Lawn Mowing",
      featured: true,
      description: "Mow, trim edges along walks and beds, and blow clippings off hard surfaces.",
      pricing: {
        type: "tiered",
        unit: "per visit",
        tiers: [
          { label: "Small yard (up to ~⅛ acre)", price: 35 },
          { label: "Medium yard (~¼ acre)", price: 45 },
          { label: "Large yard (~½ acre)", price: 60 },
        ],
        overNote: "Overgrown first cut or bigger lot? We'll quote it.",
      },
      recurring: "weekly or every 2 weeks",
      proRange: "$43–$72",
      proNote: "per visit",
    },
    {
      id: "mulch",
      seasons: ["spring"],
      name: "Mulch Spreading",
      description:
        "We spread fresh mulch in your beds. You buy the mulch (or we pick it up and pass along the receipt at cost).",
      pricing: {
        type: "perUnit",
        rate: 30,
        unit: "cubic yard",
        minUnits: 2,
        note: "Labor only. Mulch itself billed at cost.",
      },
      proRange: "$25–$70",
      proNote: "labor per cubic yard",
    },

    // ---------------------------- WINTER ----------------------------
    {
      id: "shoveling",
      seasons: ["winter"],
      name: "Driveway Shoveling",
      featured: true,
      description:
        "Hand-shoveled driveway after each storm, cleared edge to edge so you can get out in the morning.",
      pricing: {
        type: "tiered",
        unit: "per storm visit",
        tiers: [
          { label: "1-car driveway", price: 30 },
          { label: "2-car driveway", price: 40 },
          { label: "Large or long driveway (3+ cars)", price: 55 },
        ],
        overNote: "Priced for up to 8\" of snow.",
      },
      extras: [
        { id: "walk", label: "Front walk, steps & sidewalk", price: 10 },
        { id: "salt", label: "Ice melt applied (we bring it)", price: 15 },
        { id: "deep", label: "Heavy storm, over 8\" of snow", percent: 50 },
      ],
      proRange: "$30–$75",
      proNote: "per visit",
    },
    {
      id: "snow-plan",
      seasons: ["winter"],
      name: "Snow Season Plan",
      description:
        "Pay once, never think about snow. Includes driveway + front walk for up to 12 storms (2\"+) from Dec to Mar. Extra storms are $25 each.",
      pricing: {
        type: "tiered",
        unit: "per season",
        tiers: [
          { label: "1-car driveway", price: 260 },
          { label: "2-car driveway", price: 325 },
          { label: "Large or long driveway (3+ cars)", price: 425 },
        ],
      },
      proRange: "$350–$600",
      proNote: "per season (national avg. ≈ $700)",
    },
  ],

  faq: [
    {
      q: "Are you insured?",
      a: "Ask us about our current coverage when you book. We're upfront about what we do and don't cover.",
    },
    {
      q: "Do I need to be home?",
      a: "Nope. Just make sure gates are unlocked and pets are inside. We'll text you a photo when we're done.",
    },
    {
      q: "How do I pay?",
      a: "Venmo, Zelle, or cash after the job is done. No deposit for one-time jobs.",
    },
    {
      q: "Do you do gutters or roof work?",
      a: "No. We keep our feet on the ground, so no ladders, roofs or tree climbing.",
    },
    {
      q: "What if it rains or snows on my booked day?",
      a: "We'll text you and move you to the next open slot. Snow customers are served in the order they signed up, starting the morning after the storm ends.",
    },
    {
      q: "Do you have a referral discount?",
      a: "Yes. Refer a neighbor and you both get $10 off your next visit.",
    },
  ],
};

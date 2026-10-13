/*
 * ============================================================
 *  LEAVES AWAY SITE CONFIG — this is the only file you need to edit
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
    name: "Leaves Away",
    tagline: "Four college kids. Four rakes. Zero leaves left behind.",
    pitch:
      "We're Asita, Matthew, Thant and Juan, four students based in Chestnut Hill. We rake, tidy up yards and shovel snow around Newton and nearby, for a lot less than the big landscaping companies (and with way more enthusiasm).",
    city: "Chestnut Hill",
    serviceArea: [
      "Chestnut Hill",
      "Newton Centre",
      "Newton Highlands",
      "Newtonville",
      "West Newton",
      "Auburndale",
      "Waban",
      "Brookline",
      "Brighton",
    ],
    phone: "+1 (651) 895-2257",
    email: "adamsjuan257@gmail.com",
    instagram: "", // e.g. "leavesaway" (leave blank to hide)
    crew: [
      { name: "Asita", role: "Chief Leaf Officer" },
      { name: "Matthew", role: "Rake Whisperer" },
      { name: "Thant", role: "Head of Bags" },
      { name: "Juan", role: "Snow Boss (in training)" },
    ],
    // Where booking requests are sent. FormSubmit (https://formsubmit.co)
    // emails every request to the address at the end of this URL, with no
    // account needed. The very first request triggers a one-time activation
    // email to that inbox; click the link in it and requests start arriving.
    // A Formspree URL (https://formspree.io/f/...) works here too. If left
    // blank, customers get a copyable request to text or email you instead.
    formEndpoint: "https://formsubmit.co/ajax/adamsjuan257@gmail.com",
  },

  // Months are 1-12. The site opens on the season that matches today's date.
  seasons: [
    { id: "fall", label: "Fall", icon: "leaf", months: [9, 10, 11], active: true },
    {
      id: "winter",
      label: "Winter",
      icon: "snowflake",
      months: [12, 1, 2],
      active: false, // flip to true when the crew is ready to shovel
      comingSoonNote: "Snow shoveling starts this winter. Join the snow list now and you'll be first on our route when the flakes fly.",
    },
  ],

  // The "Something else?" card and booking checkbox, for jobs that aren't on
  // the price list. Requests come in like any other booking, with the
  // customer's description in the notes.
  otherHelp: {
    name: "Something else",
    heading: "Need help with something else?",
    description:
      "Hauling junk to the curb, planting a few things, clearing out a shed, helping with a garden project... If it's outdoors and doesn't need a ladder, ask us. We'll tell you honestly if we can do it and what it'll cost.",
  },

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
        "We rake lawns and beds, chase leaves off the driveway and walks, and bag every last one for curbside pickup. Yes, even the soggy ones.",
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
      seasons: ["fall"],
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

    // ---------------------------- WINTER ----------------------------
    {
      id: "shoveling",
      seasons: ["winter"],
      name: "Driveway Shoveling",
      featured: true,
      description:
        "Hand-shoveled after every storm, edge to edge, so you can get to work and we can get to class.",
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
      q: "Will you jump in the leaf pile?",
      a: "Only with permission. Otherwise every leaf goes in a bag, like the professionals we are. Mostly.",
    },
    {
      q: "Which towns do you cover?",
      a: "We're based in Chestnut Hill and work all over Newton, plus Brookline and Brighton. A little farther out? Ask anyway. If a few neighbors on your street book together, we'll make the trip.",
    },
    {
      q: "Are you insured?",
      a: "Ask us about our current coverage when you book. We're upfront about what we do and don't cover.",
    },
    {
      q: "Do I need to be home?",
      a: "Nope. Leave the gate unlocked and the dog inside, and we'll text you a before-and-after photo when we're done.",
    },
    {
      q: "How do I pay?",
      a: "Venmo, Zelle or cash, after the job is done and you're happy with it. No deposit for one-time jobs.",
    },
    {
      q: "Do you do gutters or roof work?",
      a: "No. We keep our feet on the ground: no ladders, roofs or tree climbing. We're happy to recommend someone who does.",
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

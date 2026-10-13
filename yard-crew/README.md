# Campus Yard Crew website

A one-page website for a student-run raking, landscaping and (later) snow-shoveling side business. It's plain HTML/CSS/JS: no build step, no server, free to host.

## What's on the site

- **Services & prices by season.** Fall, Spring & Summer, and Winter tabs. The site opens on whatever season it currently is.
- **Instant estimate.** Customers pick a service, a yard or driveway size and any add-ons, and get a price right away. They can send that estimate along with their booking.
- **"How we compare" table.** Your prices next to typical professional prices.
- **Booking form.** Sends requests to your email (see below).
- Crew, service area, FAQ, and contact info.
- Works on phones and supports dark mode.

## Make it yours: edit `config.js`

Everything you'll want to change is in **`config.js`**:

| What | Where in `config.js` |
| --- | --- |
| Business name, tagline, phone, email, town, neighborhoods, crew names | `business` |
| Prices, sizes, add-ons | `services` |
| Turn a season on/off | `seasons` → `active` |
| FAQ answers | `faq` |

### Turning on snow shoveling this winter

Winter services are already built in and priced. They show as **"Coming soon"** and the booking form treats them as a **snow waitlist**, so you can collect customers before the first storm.

When you're ready, open `config.js` and change one line:

```js
{ id: "winter", ..., active: false }   // → active: true
```

### Adding a new service later

Copy any entry in `services`, give it a new `id`, `name`, `seasons` and `pricing`, and it automatically shows up in the cards, the estimator, the comparison table and the booking form. Three pricing types are supported:

- `tiered`: fixed price per size (yards, driveways)
- `hourly`: rate per crew member per hour, with a minimum
- `perUnit`: rate per bag, cubic yard, etc., with a minimum

## Getting booking requests

Every request from the booking form is **emailed to you** through [FormSubmit](https://formsubmit.co), a free service that needs no account. The address is the end of `business.formEndpoint` in `config.js` (currently `adamsjuan257@gmail.com`).

**One-time setup:** the very first request sends an activation email from FormSubmit to that inbox. Click the link in it, and every request after that arrives as an email with the customer's details in a table. Hit **Reply** to answer the customer directly. Do a test booking on the live site yourself to trigger this, and check spam if you don't see it.

If sending ever fails (before activation, or no internet), the customer sees their request ready to copy and text or email to you, so no request is lost.

To use a different inbox, change the email at the end of `formEndpoint` (it needs its own one-time activation). A [Formspree](https://formspree.io) form URL also works there if you'd rather have a dashboard of past requests.

## Preview and publish

- **Preview:** double-click `index.html` to open it in your browser.
- **Publish for free** (pick one):
  - **Netlify Drop:** drag the `yard-crew` folder onto <https://app.netlify.com/drop>.
  - **GitHub Pages:** put these files in their own repo, then Settings → Pages → deploy from branch.
  - **Vercel:** import the repo and set the root directory to `yard-crew`.
- Optional: buy a domain (about $10–15/yr) like `campusyardcrew.com` and point it at the host.

---

## Pricing rationale

Prices are set to be **clearly cheaper than professional landscaping and snow companies** but still pay the crew well. At the medium-yard price, a 2-person crew raking a typical ¼-acre lot in about 2 hours makes **$120, or about $30 per person per hour**, well above typical campus jobs.

National 2026 cost guides were used as the benchmark. Your local market may be higher (big metro areas) or lower (rural areas), so **check two or three local competitors (Google, Nextdoor, Facebook Marketplace) and adjust `config.js`**.

| Service | Our price | Typical pro price | Source |
| --- | --- | --- | --- |
| Leaf raking & bagging | $75 / $120 / $195 by yard size | $160–$290 for a ¼-acre yard; avg. ≈ $170/visit; raking labor $25–$50/hr | Lawn Love, LawnStarter |
| Bag haul-away | $5/bag | $5–$10/bag | LawnStarter |
| Yard cleanup (fall/spring) | $25 per crew member/hr, 2 crew-hr minimum | $40–$80/hr | Jobber / lawn-care guides |
| Lawn mowing | $35 / $45 / $60 by yard size | $43–$72 per visit | Jobber |
| Mulch spreading | $30 per cubic yard (labor) | $25–$70 per cubic yard (labor) | Inch Calculator, Lawn Love |
| Driveway shoveling | $30 / $40 / $55 per storm | $30–$75 per visit | Housecall Pro, Lawn Love |
| Ice melt | +$15 | $20–$60 per application | Housecall Pro, Lawn Love |
| Snow season plan | $260 / $325 / $425 | $350–$600 per season (avg. ≈ $700) | Housecall Pro, Lawn Love |

**Why these numbers work:**

- **Leaf raking is the money-maker.** Pros charge $160+ for a typical yard; at $120 you're about 25–40% cheaper and still earn about $30/hr each.
- **Mowing and shoveling are priced at the low end of the pro range,** not drastically below it. Those markets already include cheap competitors (neighborhood kids, people with plows), and pricing too low makes people doubt your quality.
- **Recurring discount (10%)** for mowing and repeat leaf visits keeps your schedule full. Pros give 10–25% off for recurring service.
- **The snow season plan is capped at 12 storms** (extra storms $25 each) so a brutal winter doesn't wipe out your profit.
- **Heavy snow surcharge (+50% over 8")** because hand-shoveling deep snow takes 2–3 times as long.

**Sources:**

- [Lawn Love: Leaf removal cost 2026](https://lawnlove.com/blog/?p=12523)
- [LawnStarter: Leaf removal price](https://www.lawnstarter.com/blog/cost/leaf-removal-price/)
- [GreenPal: Leaf removal cost](https://www.yourgreenpal.com/blog/how-much-does-leaf-removal-cost)
- [Jobber: How much to charge for lawn mowing (2026)](https://getjobber.com/academy/lawn-care/how-to-price-out-lawn-care-services/)
- [Inch Calculator: Mulch installation cost](https://www.inchcalculator.com/mulch-landscaping-cost-guide/)
- [Lawn Love: Mulch cost](https://lawnlove.com/blog/?p=13168)
- [Housecall Pro: Snow removal prices](https://www.housecallpro.com/resources/snow-removal-prices/)
- [Lawn Love: Snow removal cost 2026](https://lawnlove.com/blog/?p=13176)

## Before you launch: quick business checklist

- **Liability insurance.** A cheap general-liability policy for a small lawn business protects you if someone's property gets damaged. The FAQ tells customers to ask about coverage, so update that answer once you have it.
- **Local rules.** Some towns require a basic business license, even for small side gigs.
- **Taxes.** Side income is taxable. Track what you earn and what you spend (gas, bags, rakes, salt).
- **Payments.** Set up Venmo Business or Zelle so payments look professional and are easy to track.
- **Marketing.** Door-hangers with a QR code to the site, Nextdoor posts, and asking happy customers for referrals (the site advertises $10 off for both).

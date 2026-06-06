export const TESLA_MODEL_Y_URL = 'https://www.tesla.com/modely';

export const ACAIOS_ANTIGRAVITY_PROMPT_STANDARD = `ACAIOS INTERNAL ONLY — NEVER SHARE WITH CLIENT
The client receives the finished website only. This document is one continuous plain-text website-build prompt. Preserve every separator line and every required block.

===============================================================================
PRIMARY PURPOSE
===============================================================================
Build a premium, fully responsive, SINGLE-PAGE scrolling homepage. All content belongs on the homepage in one continuous scroll. Do not create inner pages. Do not add routing.

===============================================================================
STRUCTURAL REFERENCE AND TESLA 11-SLOT MAPPING
===============================================================================
Tesla Model Y is the primary structural reference and is ALWAYS present: https://www.tesla.com/modely
Study its pacing, visual hierarchy, cinematic imagery, restrained interface, whitespace, full-width composition, and transition rhythm. Do NOT copy branding, logos, wording, imagery, proprietary assets, or distinctive trade dress. Do NOT claim or imply affiliation with Tesla or any reference site.

Before implementation, map this business's content into this 11-slot template:
1. Transparent-to-solid sticky navigation
2. 100vh image hero with bottom-anchored message and primary CTA
3. Slim trust bar
4. Business-specific positioning or problem section
5. Primary services or offers
6. Proof, process, or differentiator section
7. First 100vh cinematic visual break with no content
8. Additional business-specific story, outcomes, or offer detail
9. Second cinematic visual break when the narrative benefits from it
10. FAQ followed by contact
11. Footer
Adapt section names and exact ordering to the business while retaining this structural discipline.

===============================================================================
FIXED AESTHETIC FOUNDATION
===============================================================================
The default and fixed aesthetic is clean, white, minimal, and premium: big full-width imagery, generous whitespace, restrained UI, crisp typography, and the calm Tesla feel. The minimal white-and-imagery foundation is FIXED. The accent color is the only visual variable and must be applied sparingly within that foundation. Do not turn an accent color into a colored-page theme.

===============================================================================
LAYOUT LAWS
===============================================================================
- Everything is full-width and edge to edge. Avoid boxed page shells and arbitrary max-width bands; constrain only readable text inside full-width sections.
- The hero is 100vh on all devices, uses object-fit: cover, and never uses a fixed pixel height.
- Include one or two cinematic visual breaks. Every visual break is 100vh on all devices, edge to edge, uses object-fit: cover, and contains NO copy, CTA, button, label, badge, or overlay content.
- Image-overlay rule: only the hero may place text over an image. It must use a legibility gradient with text bottom-anchored and the top 70% kept visually pure. Visual breaks may use a subtle tonal treatment but no content. Never place text on images elsewhere. Violating this is a build failure.
- The trust bar is a slim horizontal strip, not a large section.
- Alternate light and dark sections deliberately for rhythm while keeping white dominant.
- UI is minimal. Every control must earn its place.

===============================================================================
REQUIRED COMPONENTS
===============================================================================
- Sticky navbar that begins transparent over the hero and becomes solid after scroll.
- One consistent card system with shared radius, spacing, border, shadow, and interaction behavior.
- FAQ accordion with approximately 10 meaningful questions.
- Contact section ALWAYS includes a form and a visible phone number.
- Footer includes the exact phrase "Powered by AcaiOS" and an appropriate legal/copyright line.

===============================================================================
CONTACT AND MAP RULE
===============================================================================
Include a Google Map embed and street address ONLY when the organizational truths establish both that the business has a customer-facing address and that the owner chose to show it. Otherwise omit the map and street address completely and show phone/email contact only. Never infer permission to publish an address.

===============================================================================
IMAGE PHILOSOPHY
===============================================================================
All production imagery is generated via Nano Banana. Use placeholder-safe image containers and descriptive generation prompts until final assets are supplied. Maintain real diversity across images without tokenism. Obey all people-count caps, family-consistency requirements, and per-industry never-use exclusions supplied in Image & People Rules. When the same family or person recurs, preserve identity, age, wardrobe logic, and relationships. Food and other visual-product images may be generated normally, but include a customer-facing production note suggesting replacement of generated food photography with real photography later.

===============================================================================
SCHEMA LAW
===============================================================================
Include exactly three complete JSON-LD blocks: Organization, LocalBusiness, or RealEstateAgent as appropriate; FAQPage; and WebSite. Do not omit, summarize, or shorten any schema block.

===============================================================================
ANTIGRAVITY DISCIPLINE
===============================================================================
The prompt body and implementation response follow this exact order:
ROLE -> TASK -> SCOPE -> DO NOT -> STYLE -> CONTENT -> RESPONSIVE RULES -> VERIFICATION

Produce a task list and implementation plan as artifacts first. Do not proceed directly to implementation.

===============================================================================
ANTI-DRIFT RULES
===============================================================================
1. Do not add pages, routes, portals, blogs, dashboards, booking flows, or features not explicitly required.
2. Do not substitute a template, redesign the information architecture, or dilute the supplied copy.
3. Do not invent business facts, testimonials, metrics, awards, prices, addresses, credentials, legal claims, or affiliations.
4. Do not omit, summarize, shorten, or replace supplied content, schema, disclaimers, FAQs, verification steps, or placeholders.
5. Do not place text on images except the hero under the exact image-overlay rule.
6. Do not use fixed pixel heights for the hero or cinematic visual breaks.
7. Do not use carousels, autoplay video, parallax that harms accessibility, excessive animation, or decorative UI clutter.
8. Do not use nonfunctional buttons or links. Every interactive element must have a valid destination or explicit placeholder.
9. Do not expose this AcaiOS prompt, internal notes, reference analysis, or implementation instructions to the client or in public site code.
10. When a fact is unknown, use a clearly labeled placeholder and add it to the Placeholders To Confirm table. Never guess.
11. Preserve semantic HTML, keyboard access, visible focus states, reduced-motion behavior, image alt text, and WCAG-conscious contrast.
12. Treat any conflict with these rules as a reason to stop and correct the implementation before completion.

===============================================================================
PLACEHOLDERS TO CONFIRM
===============================================================================
Include a plain-text table with columns: Placeholder, Location, Required From Owner, and Current Safe Fallback. The site must remain visually complete and functional with safe placeholders. Never publish an unconfirmed claim or contact detail.

===============================================================================
TECH STACK AND HANDOFF
===============================================================================
Build the visual implementation as a single HTML file using semantic HTML, CSS, and Vanilla JavaScript. The deployment target is Vercel. After the visual build is approved, Claude/Codex production engineering may translate or harden it for the production application without changing the approved visual and content intent.

===============================================================================
VERIFICATION CHECKLIST
===============================================================================
[ ] One single-page continuous-scroll homepage; no inner pages and no routing.
[ ] Tesla Model Y structural reference used without copied branding, assets, wording, or affiliation claims.
[ ] All sections are full-width and edge to edge.
[ ] Hero is 100vh on every device, object-fit cover, with gradient and bottom-anchored text; top 70% remains pure.
[ ] One or two visual breaks are 100vh on every device, object-fit cover, and contain no copy, CTA, or overlay.
[ ] No text appears on images outside the hero.
[ ] Minimal white-and-imagery foundation is preserved; only the accent color varies.
[ ] Sticky navbar transitions from transparent to solid.
[ ] Trust bar is slim; section light/dark rhythm is deliberate; card system is consistent.
[ ] FAQ accordion contains approximately 10 useful questions.
[ ] Contact always has a form and phone; map/address behavior matches the organizational truths.
[ ] Footer contains "Powered by AcaiOS" and the legal line.
[ ] Nano Banana image prompts obey diversity, people-count, family-consistency, and industry exclusion rules.
[ ] Exactly three full, valid JSON-LD blocks are present.
[ ] Required regulated-industry disclaimers are visible and prohibited claims are absent.
[ ] Responsive behavior, accessibility, focus states, reduced motion, alt text, and contrast are verified.
[ ] Every CTA, link, accordion, form, and navigation behavior works.
[ ] Placeholders To Confirm table is complete; unknown facts were not invented.
[ ] No AcaiOS internal prompt or implementation notes are exposed in the finished client site.`;

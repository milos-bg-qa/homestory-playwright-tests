// tests/price-filter.spec.ts
import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

// Base URL of the HomeStory search demo
const BASE_URL = "https://search.homestory.co/";
// Location we use across all scenarios
const LOCATION_TEXT = "Houston, TX";

// Visible labels used in the price filter dropdowns
const MIN_PRICE_LABEL_100K = "$100,000";
const MAX_PRICE_LABEL_500K = "$500,000";
const MAX_PRICE_LABEL_5M = "$5,000,000";

// Helper to format numbers in "k" for assertion of button labels
function toK(value: number): string {
  return `${value / 1000}k`;
}

// Table-driven definition of all price filter scenarios covered by tests
const scenarios = [
  {
    // Scenario 1: only MIN is set – we expect label to show "$100k +"
    name: "only MIN = 100k → '$100k +'",
    min: { value: 300_000, label: MIN_PRICE_LABEL_100K },
    max: undefined,
    expectedLabel: /\$100k \+/i,
  },
  {
    // Scenario 2: only MAX is set – we expect label "Up to $500k"
    name: "only MAX = 500k → 'Up to $500k'",
    min: undefined,
    max: { value: 500_000, label: MAX_PRICE_LABEL_500K },
    expectedLabel: /^Up to \$500k/i,
  },
  {
    // Scenario 3: bounded range – both MIN and MAX set
    // We also verify that all listing prices fall within this range
    name: "MIN = 100k, MAX = 5M → '$100k - $5M'",
    min: { value: 100_000, label: MIN_PRICE_LABEL_100K },
    max: { value: 5_000_000, label: MAX_PRICE_LABEL_5M },
    expectedLabel: /\$100k\s*-\s*\$5m/i,
  },
];

test.describe("HomeStory – Search & Price Filter", () => {
  // Give each test more time because we’re hitting a real external site
  test.beforeEach(() => {
    test.setTimeout(120_000);
  });

  test("Location search shows Houston, TX on all listing addresses", async ({
    page,
  }) => {
    const home = new HomePage(page);

    // 1) Navigate to search page & perform location search
    await home.goto(BASE_URL);
    await home.searchForLocation(LOCATION_TEXT);

    // 2) Collect all visible listing addresses
    const addresses = await home.getAllAddresses();

    // 3) Sanity check – we expect at least one result
    expect(addresses.length).toBeGreaterThan(0);

    // 4) Assert each address contains both city and state
    addresses.forEach((text) => {
      expect(text).toMatch(/houston/i);
      expect(text).toMatch(/\btx\b/i);
    });
  });

  // Iterate over all defined price scenarios to avoid duplicated test code
  for (const s of scenarios) {
    test(`Price filter – ${s.name}`, async ({ page }) => {
      const home = new HomePage(page);

      // 1) Navigate & search for the target location
      await home.goto(BASE_URL);
      await home.searchForLocation(LOCATION_TEXT);

      // 2) Capture initial prices to compare list size after filtering
      const initialPrices = await home.getAllResultPrices();

      // 3) Open the price filter popover (works for all button label states)
      await home.openPriceFilter();

      // 4) Apply min/max selections based on scenario
      if (s.min) await home.priceFilter.setMinByLabel(s.min.label);
      if (s.max) await home.priceFilter.setMaxByLabel(s.max.label);

      // 5) Click Apply when present (some UIs auto-apply)
      await home.priceFilter.applyIfVisible();

      // 6) Verify that the price pill label matches our expectation
      const label = await home.getPriceFilterLabel();
      expect(label).toMatch(s.expectedLabel);

      // 7) Collect all listing prices after filtering
      const prices = await home.getAllResultPrices();
      expect(prices.length).toBeGreaterThan(0);

      // 8) For bounded range scenarios, enforce both MIN and MAX on each price
      for (const price of prices) {
        if (s.min && s.max) {
          // Bounded range: enforce both sides
          expect(price).toBeGreaterThanOrEqual(s.min.value);
          expect(price).toBeLessThanOrEqual(s.max.value);
        }
      }

      // 9) Filtered results should not exceed original result count
      expect(prices.length).toBeLessThanOrEqual(initialPrices.length);
    });
  }
});

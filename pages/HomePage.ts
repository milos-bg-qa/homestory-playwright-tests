// pages/HomePage.ts
import { Page, Locator, expect } from "@playwright/test";
import { PriceFilter } from "./PriceFilter";

// Stable CSS selectors used for Home page elements
const LOCATION_SELECTOR = '[data-qa="search-location-typeahead"]';
const ADDRESS_SELECTOR = "div.listingItem__address___CKkGl";
const PRICE_SELECTOR = 'div[class*="listingItem__price"]';

// Page Object Model wrapper for the HomeStory search page
export class HomePage {
  readonly page: Page;
  readonly locationInput: Locator;
  readonly priceFilterButton: Locator;
  readonly listingAddresses: Locator;
  readonly listingPrices: Locator;
  readonly priceFilter: PriceFilter;

  constructor(page: Page) {
    this.page = page;

    // Location typeahead input at the top of the search page
    this.locationInput = page.locator(LOCATION_SELECTOR);

    // Price filter pill / button – matches both "Price" and price ranges
    this.priceFilterButton = page
      .getByRole("search")
      .getByRole("button", { name: /price|\$/i });

    // Locators for listing address and price blocks
    this.listingAddresses = page.locator(ADDRESS_SELECTOR);
    this.listingPrices = page.locator(PRICE_SELECTOR);

    // Compose with dedicated PriceFilter POM for min/max logic
    this.priceFilter = new PriceFilter(page);
  }

  // Basic navigation helper that also waits for page ready state
  async goto(baseUrl: string) {
    await this.page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Ensure search input is visible before proceeding
    await expect(
      this.locationInput,
      "Location input should be visible when search page is ready"
    ).toBeVisible({ timeout: 60_000 });
  }

  // Performs a full location search through the typeahead suggestions
  async searchForLocation(locationText: string) {
    const clearButton = this.page.getByRole("button", { name: "Clear" });
    // Clear existing query if Clear is visible (re-search scenario)
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
    }

    // Type into location input with slight delay to mimic real user
    await this.locationInput.click();
    await this.locationInput.fill("");
    await this.locationInput.type(locationText, { delay: 100 });

    // Wait for exact suggestion and click it
    const suggestion = this.page.getByRole("option", {
      name: locationText,
      exact: true,
    });

    await expect(
      suggestion,
      `Exact suggestion "${locationText}" should appear`
    ).toBeVisible({ timeout: 10_000 });

    await suggestion.click();

    // Wait until at least one listing is visible (search completed)
    await expect(
      this.listingAddresses.first(),
      "At least one listing should be visible after search"
    ).toBeVisible({ timeout: 60_000 });
  }

  // Returns the current label of the price filter pill (“Price”, “$100K +”, etc.)
  async getPriceFilterLabel(): Promise<string> {
    const text = await this.priceFilterButton.textContent();
    return text?.trim() ?? "";
  }

  // Opens the price filter popover regardless of its current label
  async openPriceFilter() {
    // This will match:
    // - "Price"            (initial state)
    // - "$300K +"          (only MIN selected)
    // - "Up to $500K"      (only MAX selected)
    // - "$300K - $5000K"   (MIN + MAX selected)
    const priceButton = this.page.getByRole("button", {
      name: /price|up to|\$\d/i,
    });

    await priceButton.first().click();

    // Wait until the price panel is actually open (MIN combobox is visible)
    await this.page
      .getByRole("combobox", { name: /minimum price/i })
      .waitFor({ state: "visible" });
  }

  // Collects all listing address texts on the current result page
  async getAllAddresses(): Promise<string[]> {
    const count = await this.listingAddresses.count();
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
      result.push((await this.listingAddresses.nth(i).innerText()).trim());
    }

    return result;
  }

  // Collects all listing prices as numeric values
  async getAllResultPrices(): Promise<number[]> {
    const texts = await this.listingPrices.allInnerTexts();
    return texts
      .map((t) => parsePrice(t))
      .filter((n): n is number => n !== null);
  }
}

// Helper used by getAllResultPrices to parse "$xxx,xxx" into a number
function parsePrice(text: string): number | null {
  // Take only the first "$xxx,xxx" from the price block
  const match = text.match(/\$([\d,]+)/);
  if (!match) return null;

  const numeric = match[1].replace(/,/g, "");
  const value = Number(numeric);

  return Number.isNaN(value) ? null : value;
}

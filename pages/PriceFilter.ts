// pages/PriceFilter.ts
import { Page, Locator, expect } from "@playwright/test";

// Dedicated POM for the price filter popover (min/max + apply/clear)
export class PriceFilter {
  readonly page: Page;
  readonly applyButton: Locator;
  readonly clearButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // “Apply” button in the price filter popover
    this.applyButton = page.getByRole("button", { name: /apply/i });
    // “Clear/Reset/Remove” button used to reset filter state
    this.clearButton = page.getByRole("button", {
      name: /clear|reset|remove/i,
    });
  }

  // Sets the MIN value by selecting the option with the exact label
  async setMinByLabel(label: string) {
    const minCombo = this.page.getByRole("combobox", {
      name: /minimum price|min/i,
    });

    await expect(minCombo).toBeVisible();
    await minCombo.click();
    await this.page.getByRole("option", { name: label }).click();
  }

  // Internal helper: ensures that the MAX combobox is visible
  // Handles cases where the price popover is closed and needs reopening
  private async ensurePricePopoverOpenForMax() {
    const maxCombo = this.page.getByRole("combobox", {
      name: /maximum price|max/i,
    });

    // If MAX is already visible, nothing to do
    if (await maxCombo.isVisible().catch(() => false)) {
      return maxCombo;
    }

    // Otherwise click the selected price pill, e.g. "$300K +" or "Up to $500K"
    const pricePill = this.page.getByRole("button", {
      name: /\$\s*\d+\s*k\s*\+|up to\s*\$\s*\d+\s*k/i,
    });

    await pricePill.click();
    await expect(maxCombo).toBeVisible();
    return maxCombo;
  }

  // Sets the MAX value by selecting the option with the exact label
  async setMaxByLabel(label: string) {
    // Make sure the price popover is actually open
    const maxCombo = await this.ensurePricePopoverOpenForMax();

    await maxCombo.click();
    await this.page.getByRole("option", { name: label }).click();
  }

  // Clicks "Apply" only when the button is visible – keeps tests robust
  async applyIfVisible() {
    if (await this.applyButton.isVisible().catch(() => false)) {
      await this.applyButton.click();
      // Wait for backend requests triggered by Apply to settle
      await this.page.waitForLoadState("networkidle");
    }
  }

  // Clicks "Clear/Reset/Remove" only if visible and waits for refresh
  async clearIfVisible() {
    if (await this.clearButton.isVisible().catch(() => false)) {
      await this.clearButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }
}

# HomeStory Playwright Test Automation

This project contains an automated UI test suite for the HomeStory Search application, implemented using Playwright and TypeScript. 
The test suite focuses on validating core search functionality and the price filter behavior, ensuring accuracy and reliability of the search experience.

---

## Project Structure

```
project-root/
  ├── pages/
  │     ├── HomePage.ts
  │     └── PriceFilter.ts
  │
  ├── tests/
  │     └── price-filter.spec.ts
  │
  ├── playwright.config.ts
  ├── package.json
  ├── README.md
```

---

## Features Covered

### Search Functionality
- Performs location search using the HomeStory typeahead field.
- Validates that all returned listings belong to the searched location.
- Waits for results to fully refresh before making assertions.

### Price Filter Coverage
The tests verify multiple UI states and result behaviors:
- Selecting **minimum price only**.
- Selecting **maximum price only**.
- Selecting **both minimum and maximum**.
- Asserting price range label formatting.
- Ensuring UI updates properly after selecting prices.
- Ensuring filtered results stay within the expected price boundaries.
- Ensuring result count does not increase after filtering.

---

## Running Tests

### Install Dependencies
```
npm install
```

### Install Playwright Browsers
```
npx playwright install
```

### Run All Tests
```
npx playwright test
```

### Run in Headed Mode (recommended for CAPTCHA environments)
```
npx playwright test --headed --workers=1
```

---

## Adding to CI (Optional)
A basic GitHub Actions workflow would look like:

```
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

---

## Reporting
Playwright HTML reports are automatically generated after each test run:

```
npx playwright show-report
```

---

## Best Practices Followed
- Page Object Model (POM) structure.
- Minimal flaky selectors (role‑based locators preferred).
- Load‑state and visibility synchronization.
- Clear separation between test logic and UI interaction logic.
- Scenario‑driven test design for price filters.
- Optimized for maintainability and readability.

---

## Contact
For further automation enhancements, extensions, or integration into CI/CD, feel free to reach out.

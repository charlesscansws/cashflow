/**
 * Country and Currency Dropdowns: Populated dynamically using the getISOCountryCodes function.

Field Visibility:
 UK: Shows ukSpecificFields, hides nonEUFields and internationalFields.
 Non-EU: Shows nonEUFields, hides ukSpecificFields, and requires the IBAN.
 EU: Shows internationalFields, hides ukSpecificFields and nonEUFields, and requires the IBAN.

Default Values: For Non-EU fields, default values are set as specified if street_line1, city, or postcode are missing.
 * 
 */
function getISOCountryCodes() {
    return [
        { code: "LU", name: "Luxembourg", ccy: "EUR", geo: "EU" },
        { code: "CH", name: "Switzerland", ccy: "CHF", geo: "Non-EU" },
        { code: "GB", name: "United Kingdom", ccy: "GBP", geo: "UK" },
        { code: "FR", name: "France", ccy: "EUR", geo: "EU" },
        { code: "ES", name: "Spain", ccy: "EUR", geo: "EU" },
        { code: "US", name: "United States", ccy: "USD", geo: "Non-EU" },

        // Add more countries here as needed
    ];
}

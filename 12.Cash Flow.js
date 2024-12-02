//"API - Accounts"!J
function generateAccountKeys() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("API - Accounts");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues(); // Assuming columns A to F
  const outputColumnIndex = 10; // Column J corresponds to index 10
  const output = [["key"]]; // Start with a header row

  // Clear the target column before writing
  clearOutputColumn(sheet, outputColumnIndex);

  // Generate dynamic keys
  data.forEach(row => {
    const [colA, colB, , colD, colE, colF] = row; // Adjust to your column references
    let key = "";

    // Check if F column equals "active"
    if (colF === "active") {
      key = `ID:${colB}¦¦ACC:${colA}¦¦CCY${colE}¦¦AMOUNT:${colD}¦¦STATUS:${colF}`;
    } else {
      key = "NA"; // Set to NA if F is not "active"
    }

    output.push([key]);
  });

  // Write the output back to the sheet
  sheet.getRange(1, outputColumnIndex, output.length, 1).setValues(output);
}

function clearOutputColumn(sheet, columnIndex) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(1, columnIndex, lastRow).clearContent(); // Clears content starting from the header
  }
  }

//"API - Accounts"!K
function accountsKeys() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const accountsSheet = spreadsheet.getSheetByName("API - Accounts");
  
  // Get data from relevant columns
  const data = accountsSheet.getRange(2, 1, accountsSheet.getLastRow() - 1, 6).getValues(); // Columns A to F
  
  const keys = data.map(row => {
    if (row[1] !== "") { // Check if Column B (index 1) is not empty
      return `${row[0]}¦¦${row[4]}`.toUpperCase(); // Concatenate and convert to upper case
    }
    return ""; // Empty value if Column B is empty
  });

  // Write the computed keys to Column J
  const outputRange = accountsSheet.getRange(2, 11, keys.length, 1); // Column K starting from row 2
  outputRange.setValues(keys.map(key => [key])); // Map keys to a 2D array for setValues
}

//"API - Counterparties"!M
function populateKeyMatchColumn() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Get all relevant data from the sheet
  const data = counterpartiesSheet.getDataRange().getValues();

  // Prepare the header and the new values for column M
  const header = ["key Match"];
  const values = data.slice(1).map(row => {
    const [ , b, , d, e, , , , , , k] = row; // Extract relevant columns (B, D, E, K)

    if (b !== "") {
      if (e) {
        // If column E has a displayed value
        return `${b}¦¦${d}¦¦ALL`.toUpperCase();
      } else {
        // Default rule
        return `${b}¦¦${d}¦¦${k}`.toUpperCase();
      }
    }

    return ""; // If column B is empty
  });

  // Update column M with the new values
  counterpartiesSheet.getRange(1, 13, 1).setValue(header); // Set header in M1
  counterpartiesSheet.getRange(2, 13, values.length, 1).setValues(values.map(value => [value])); // Set values below
}

//"API - Counterparties"!L
function populateCounterpartiesKeyColumn() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Get all relevant data from the sheet
  const data = counterpartiesSheet.getDataRange().getValues();

  // Prepare the header and the new values for column L
  const header = ["key Cty"];
  const values = data.slice(1).map(row => {
    const [ , b, c, d, e, f, g, h, i, , k] = row;

    if (c !== "") {
      if (e) {
        return `ACC:${b}¦¦ID:${c}¦¦${d}¦¦Revtag:${e}`.toUpperCase();
      } else if (f && g) {
        return `ACC:${b}¦¦ID:${c}¦¦${d}¦¦Account:${f}¦¦Sort Code:${g}¦¦CCY:${k}`.toUpperCase();
      } else if (h && i) {
        return `ACC:${b}¦¦ID:${c}¦¦${d}¦¦IBAN:${h}¦¦BIC:${i}¦¦CCY:${k}`.toUpperCase();
      }
    }

    return ""; // If no condition is met
  });

  // Update column L with the new values
  counterpartiesSheet.getRange(1, 12, 1).setValue(header); // Set header in L1
  counterpartiesSheet.getRange(2, 12, values.length, 1).setValues(values.map(value => [value])); // Set values below
}

//Cash Flow!Q
function populateCashFlowAccountDropdowns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const assetsSheet = spreadsheet.getSheetByName("API - Assets");

  // Get data from "Cash Flow!J2:J", "Cash Flow!Q2:Q", and "API - Assets!B2:B"
  const cashFlowData = cashFlowSheet.getRange(2, 10, cashFlowSheet.getLastRow() - 1).getValues(); // Column J
  const currentValues = cashFlowSheet.getRange(2, 17, cashFlowSheet.getLastRow() - 1).getValues(); // Column Q
  const assetsData = assetsSheet.getRange(2, 2, assetsSheet.getLastRow() - 1).getValues(); // Column B
  
  // Extract asset options and remove any empty cells
  const assetOptions = assetsData.map(row => row[0]).filter(option => option !== "");

  // Iterate through "Cash Flow!J" and populate "Cash Flow!Q" if a value exists in "Cash Flow!J"
  const dropdownRanges = [];
  cashFlowData.forEach((cashFlowValue, index) => {
    if (cashFlowValue[0] !== "") { // Check if "Cash Flow!J" has a displayed value
      const currentValue = currentValues[index][0]; // Get current value in "Cash Flow!Q"
      const rowIndex = index + 2; // Adjust for 1-based index
      const range = cashFlowSheet.getRange(rowIndex, 17); // Column Q

      // Set dropdown with asset options and default value "Please Select Account"
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Please Select Account", ...assetOptions], true)
        .build();
      range.setDataValidation(rule);

      // Only set the default value if the cell is currently empty
      if (!currentValue || currentValue.trim() === "") {
        range.setValue("Please Select Account");
      }

      dropdownRanges.push({ row: rowIndex, options: assetOptions, currentValue });
    }
  });

  // Log dropdowns for debugging
  console.log(`Dropdowns created for rows: ${JSON.stringify(dropdownRanges)}`);
}



//Cash Flow!S = //Cash Flow!U
function XpopulateBankDropdowns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Get data ranges
  const cashFlowData = cashFlowSheet.getRange(2, 26, cashFlowSheet.getLastRow() - 1).getValues(); // Column Z
  const counterpartiesKeys = counterpartiesSheet.getRange(2, 13, counterpartiesSheet.getLastRow() - 1).getValues(); // Column M
  const counterpartiesValues = counterpartiesSheet.getRange(2, 12, counterpartiesSheet.getLastRow() - 1).getValues(); // Column L

  // Iterate through "Cash Flow!Z" and find matching options from "API - Counterparties!M"
  const dropdownRanges = [];
  cashFlowData.forEach((cashFlowKey, index) => {
    if (cashFlowKey[0] !== "") {
      // Find matches between "Cash Flow!Z" and "API - Counterparties!M"
      const matchingOptions = counterpartiesKeys
        .map((keyRow, keyIndex) => {
          const counterpartyKey = keyRow[0];
          const cashFlowKeyBase = cashFlowKey[0].slice(0, -5); // Remove last 5 characters

          // Handle "¦¦ALL" case
          if (counterpartyKey.endsWith("¦¦ALL")) {
            const baseKey = counterpartyKey.slice(0, -5); // Remove "¦¦ALL"
            if (baseKey === cashFlowKeyBase || baseKey === cashFlowKey[0]) {
              return counterpartiesValues[keyIndex][0].replace(/¦¦/g, '\n');
            }
          } else if (counterpartyKey === cashFlowKey[0]) {
            return counterpartiesValues[keyIndex][0].replace(/¦¦/g, '\n');
          }
          return null;
        })
        .filter(option => option !== null); // Filter out non-matching rows

      // Determine dropdown options
      let finalOptions = [];
      let defaultOption = "Counterparty Not Defined"; // Default fallback

      if (matchingOptions.length === 1) {
        finalOptions = matchingOptions;
        defaultOption = matchingOptions[0]; // Set single matching option as default
      } else if (matchingOptions.length > 1) {
        finalOptions = ["Select Details", ...matchingOptions];
        defaultOption = "Select Details"; // Set "Select Details" as default
      } else {
        finalOptions = ["Counterparty Not Defined"]; // No matches, default to "Counterparty Not Defined"
      }

      // Apply dropdown and set default value
      const rowIndex = index + 2; // Adjust for 1-based index
      const range = cashFlowSheet.getRange(rowIndex, 19); // Column S
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(finalOptions, true)
        .build();
      range.setDataValidation(rule);
      range.setValue(defaultOption); // Set default value in the cell

      dropdownRanges.push({ row: rowIndex, options: finalOptions, default: defaultOption });
    }
  });

  // Log dropdowns for debugging
  console.log(`Dropdowns created for rows: ${JSON.stringify(dropdownRanges)}`);
}

//Cash Flow!T
function populateCashFlowPayingAgentDropdowns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const assetsSheet = spreadsheet.getSheetByName("API - Assets");

  // Get data from "Cash Flow!J2:J", "Cash Flow!Q2:Q", and "API - Assets!B2:B"
  const cashFlowData = cashFlowSheet.getRange(2, 10, cashFlowSheet.getLastRow() - 1).getValues(); // Column J
  const currentValues = cashFlowSheet.getRange(2, 20, cashFlowSheet.getLastRow() - 1).getValues(); // Column T
  const assetsData = assetsSheet.getRange(2, 2, assetsSheet.getLastRow() - 1).getValues(); // Column B
  
  // Extract asset options and remove any empty cells
  const assetOptions = assetsData.map(row => row[0]).filter(option => option !== "");

  // Iterate through "Cash Flow!J" and populate "Cash Flow!Q" if a value exists in "Cash Flow!J"
  const dropdownRanges = [];
  cashFlowData.forEach((cashFlowValue, index) => {
    if (cashFlowValue[0] !== "") { // Check if "Cash Flow!J" has a displayed value
      const currentValue = currentValues[index][0]; // Get current value in "Cash Flow!Q"
      const rowIndex = index + 2; // Adjust for 1-based index
      const range = cashFlowSheet.getRange(rowIndex, 20); // Column T

      // Set dropdown with asset options and default value "Please Select Account"
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Please Select Account", ...assetOptions], true)
        .build();
      range.setDataValidation(rule);

      // Only set the default value if the cell is currently empty
      if (!currentValue || currentValue.trim() === "") {
        range.setValue("Please Select Account");
      }

      dropdownRanges.push({ row: rowIndex, options: assetOptions, currentValue });
    }
  });

  // Log dropdowns for debugging
  console.log(`Dropdowns created for rows: ${JSON.stringify(dropdownRanges)}`);
}

 //Cash Flow!U>> OK
function XpopulatePayingAgenttDropdowns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const accountsSheet = spreadsheet.getSheetByName("API - Accounts");

  // Get data ranges
  const cashFlowData = cashFlowSheet.getRange(2, 26, cashFlowSheet.getLastRow() - 1).getValues(); // Column Z
  const accountsKeys = accountsSheet.getRange(2, 11, accountsSheet.getLastRow() - 1).getValues(); // Column K
  const accountsValues = accountsSheet.getRange(2, 10, accountsSheet.getLastRow() - 1).getValues(); // Column J
  const existingValues = cashFlowSheet.getRange(2, 21, cashFlowSheet.getLastRow() - 1).getValues(); // Column U

  // Iterate through "Cash Flow!Z" and find matching options from "API - Accounts!K"
  const dropdownRanges = [];
  cashFlowData.forEach((cashFlowKey, index) => {
    if (cashFlowKey[0] !== "") {
      // Extract the first and last parts of "Cash Flow!Z"
      const [firstPart, , lastPart] = cashFlowKey[0].split("¦¦");
      const matchingOptions = accountsKeys
        .map((keyRow, keyIndex) => {
          const [accountFirstPart, accountLastPart] = keyRow[0].split("¦¦");
          if (accountFirstPart === firstPart && accountLastPart === lastPart) {
            // Replace "¦¦" with a line break in corresponding "API - Accounts!J" value
            return accountsValues[keyIndex][0].replace(/¦¦/g, '\n');
          }
          return null;
        })
        .filter(option => option !== null); // Filter out non-matching rows

      // Determine dropdown options
      let finalOptions = [];
      let defaultOption = "Missing Account"; // Default fallback

      if (matchingOptions.length === 1) {
        finalOptions = matchingOptions;
        defaultOption = matchingOptions[0]; // Set single matching option as default
      } else if (matchingOptions.length > 1) {
        finalOptions = ["Select Account", ...matchingOptions];
        defaultOption = "Select Account"; // Set "Select Account" as default for multiple options
      } else {
        finalOptions = ["Missing Account"]; // No matches, default to "Missing Account"
      }

      // Apply dropdown
      const rowIndex = index + 2; // Adjust for 1-based index
      const range = cashFlowSheet.getRange(rowIndex, 21); // Column U
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(finalOptions, true)
        .build();
      range.setDataValidation(rule);

      // Set default value only if the cell is empty
      if (!existingValues[index][0]) {
        range.setValue(defaultOption); // Set default value in the cell
      }

      dropdownRanges.push({ row: rowIndex, options: finalOptions, default: defaultOption });
    }
  });

  // Log dropdowns for debugging
  console.log(`Dropdowns created for rows: ${JSON.stringify(dropdownRanges)}`);
}

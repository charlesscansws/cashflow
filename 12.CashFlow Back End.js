function saveCashFlowData(data) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Cash Flow");

    // Define column mappings
    const CASH_FLOW_COLUMNS = {
        ID: 1,
        DATA_ENTRY_DATE: 2,
        DOCUMENT_DATE: 3,
        PAYMENT_DUE_DATE: 4,
        LAST_STATUS_CHANGE: 5,
        GROUP: 6,
        CATEGORY: 7,
        COUNTERPART: 8,
        REFERENCE: 9,
        CCY: 10,
        VAT: 11,
        AMOUNT: 12,
        INSTALLMENT: 13,
        PAYMENT_MODE: 14,
        PURPOSE: 15,
        STATUS: 16,
        TO: 17,
        FROM: 18,
        PA_ACCOUNT: 21,
        PAYING_AGENT: 20,
        FROM_ACCOUNT: 19,
        BANK: 22,
        DEBIT_CREDIT: 23,
        LINK: 24,
    };

    const rowData = [];
    let isNewRow = true;

    for (const [key, colIndex] of Object.entries(CASH_FLOW_COLUMNS)) {
        if (data[key] !== undefined) {
            if (key === "GROUP") {
                // Save as uppercase
                rowData[colIndex - 1] = data[key].toUpperCase();
            } else {
                rowData[colIndex - 1] = data[key];
            }
        } else {
            rowData[colIndex - 1] = ""; // Fill empty columns with blank
            console.warn(`Data missing for column: ${key}`);
        }
    }

    // Check if the row already exists (match by ID)
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1); // Column A (IDs)
    const ids = dataRange.getValues().flat();
    const rowIndex = ids.indexOf(data.ID);

    if (rowIndex !== -1) {
        // Update existing row
        isNewRow = false;
        sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
        console.log("Row successfully updated:", rowData);
    } else {
        // Add new row
        sheet.appendRow(rowData);
        console.log("Row successfully added to the sheet:", rowData);
    }

    // Update column E with the log
    const now = new Date();
    const timestamp = now.toISOString().split(".")[0]; // Remove milliseconds
    const logEntry = `${timestamp}: ${data.STATUS}`;
    const logCell = isNewRow ? sheet.getRange(sheet.getLastRow(), 5) : sheet.getRange(rowIndex + 2, 5); // Column E
    const existingLog = logCell.getValue();
    const updatedLog = existingLog ? `${existingLog}\n${logEntry}` : logEntry;

    logCell.setValue(updatedLog);
    console.log("Log updated for column E:", updatedLog);
}
// Column A: Generate Unique ID
function generateUniqueId() {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
}

/**
now.getTime() generates a large number (e.g., 1700384022000 for a timestamp in milliseconds).
toString(36) converts the large number to a Base36 representation, reducing its length. For example:1700384022000 becomes 1CXO9Z.
Convert to uppercase for readability.
 */

function saveCashFlowColumnAData(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Cash Flow");

  // Iterate through data and append to "Cash Flow" sheet
  data.forEach(row => {
    const timestamp = new Date().toISOString(); // Generate a timestamp
    const uniqueId = row.uniqueId; // Extract the unique ID from the row data

    // Check if the unique ID already exists in "Cash Flow"
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1); // Column A
    const existingIds = dataRange.getValues().flat(); // Flatten to get unique IDs as an array

    if (!existingIds.includes(uniqueId)) {
      // Append the row only if the unique ID doesn't exist
      sheet.appendRow([
        uniqueId, // Column A
        '', // Empty columns B to D
        '', 
        '', 
        timestamp, // Column E
        '', '', '', '', '', '', '', '', '', '', row.status, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
      ]);
    } else {
      console.log(`Unique ID ${uniqueId} already exists in "Cash Flow".`);
    }
  });
}

//Column E
function saveCashFlowColumnEData(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Cash Flow");

  // Iterate through data and update rows in the "Cash Flow" sheet
  data.forEach(row => {
    const timestamp = new Date().toISOString(); // Current timestamp
    const newLogEntry = `${timestamp}: ${row.status}`; // New log entry

    // Find the row with the matching unique ID
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    const values = dataRange.getValues();

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === row.uniqueId) { // Match unique ID in Column A
        const currentLog = values[i][4] || ""; // Existing log in column "E" (index 4)
        const updatedLog = currentLog 
          ? `${currentLog}<br>${newLogEntry}` // Append new log entry with a break line
          : newLogEntry; // Start a new log
        
        // Update the log column "E" with the updated log
        sheet.getRange(i + 2, 5).setValue(updatedLog); // Column "E" is index 5
        break;
      }
    }
  });
}

//Column E
function getLogContent(id) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Cash Flow");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues(); // Read columns A to E

  for (const row of data) {
    if (row[0] === id) {
      return row[4] || ""; // Return the log content from column E
    }
  }
  return "No log available."; // Return a default message if no log is found
}


function populateUniqueIds() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const dataRange = cashFlowSheet.getRange(2, 1, cashFlowSheet.getLastRow() - 1, 1); // Column A starting from row 2
  const data = dataRange.getValues();

  const updatedIds = data.map(row => {
    if (!row[0]) { // If there's no ID in Column A
      const uniqueId = generateUniqueId();
      return [uniqueId];
    }
    return row; // Keep existing ID
  });

  dataRange.setValues(updatedIds);
}

function generateUniqueId() {
  const now = new Date();
  const epochMillis = now.getTime(); // Milliseconds since 1970-01-01
  return epochMillis.toString(36).toUpperCase(); // Base36 encoding
}

//Colun F////////////////////////////////
function saveCashFlowColumnFData(data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Cash Flow");

  const { id, GROUP } = data; // Extract ID and tags
  const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  const values = dataRange.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === id) { // Match the row by ID in Column A
      sheet.getRange(i + 2, 6).setValue(GROUP); // Save tags in Column F
      break;
    }
  }
}

function getExistingGroups() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash Flow");
    const data = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).getValues(); // Column F
    const uniqueGroups = [...new Set(data.flat().filter(value => value))]; // Flatten, remove empty, and get unique
    return uniqueGroups;
}

//Colun G////////////////////////////////

function getExistingCategories() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash Flow");
    const data = sheet.getRange(2, 7, sheet.getLastRow() - 1, 1).getValues(); // Column G
    const uniqueCategories = [...new Set(data.flat().filter(value => value))]; // Flatten, remove empty, and get unique
    return uniqueCategories;
}

//Colun P////////////////////////////////
function logStatusToSpreadsheet(status, dateNow) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Cash Flow");

  const lastRow = sheet.getLastRow(); // Get the last row with data

  // Update the last row of "Cash Flow!P" with the selected status
  sheet.getRange(lastRow, 16).setValue(status); // Column P

  // Update the log in "Cash Flow!AA" with the current date
  sheet.getRange(lastRow, 27).setValue(dateNow); // Column AA
}

//Colun Q////////////////////////////////
function getToDropdownOptions() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const assetsSheet = spreadsheet.getSheetByName("API - Assets");

  // Fetch data from column B (B2:B)
  const assetsData = assetsSheet.getRange("B2:B" + assetsSheet.getLastRow()).getValues();

  // Flatten the array, filter out empty rows, and sort in ascending order
  const options = assetsData.flat().filter(option => option).sort((a, b) => a.localeCompare(b));

  return options; // Return the sorted options to the frontend
}

//Colun R////////////////////////////////
function populateCashFlowCounterpartyDropdowns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Fetch all necessary data in one go
  const cashFlowData = cashFlowSheet.getRange(2, 17, cashFlowSheet.getLastRow() - 1).getValues(); // Column Q
  const cashFlowExistingValues = cashFlowSheet.getRange(2, 18, cashFlowSheet.getLastRow() - 1).getValues(); // Column R
  const counterpartiesData = counterpartiesSheet.getRange(2, 2, counterpartiesSheet.getLastRow() - 1, 3).getValues(); // Columns B, C, D

  // Create a Map for faster lookups: { Counterparty (Column B) -> [Counterparty Name (Column D)] }
  const counterpartyMap = new Map();
  counterpartiesData.forEach(row => {
    const counterpartyKey = row[0]; // Column B
    const counterpartyValue = row[2]; // Column D
    if (counterpartyKey && counterpartyValue) {
      if (!counterpartyMap.has(counterpartyKey)) {
        counterpartyMap.set(counterpartyKey, []);
      }
      counterpartyMap.get(counterpartyKey).push(counterpartyValue);
    }
  });

  // Prepare dropdowns for "Cash Flow!R"
  const dataValidations = [];
  const valuesToSet = [];
  cashFlowData.forEach((cashFlowRow, index) => {
    const cashFlowKey = cashFlowRow[0]; // Value from "Cash Flow!Q"
    const existingValue = cashFlowExistingValues[index][0]; // Existing value in "Cash Flow!R"
    let options = [];
    let defaultOption = existingValue || "No Counterparty Available"; // Keep existing value if present

    if (cashFlowKey && counterpartyMap.has(cashFlowKey)) {
      options = counterpartyMap.get(cashFlowKey);
      if (options.length === 1) {
        defaultOption = existingValue || options[0]; // Keep existing or set single option
      } else if (options.length > 1) {
        options.unshift("Select Counterparty"); // Multiple matches: add "Select Counterparty" at the top
        defaultOption = existingValue || "Select Counterparty";
      }
    } else {
      options = ["No Counterparty Available"]; // No matches: show "No Counterparty Available"
      defaultOption = existingValue || "No Counterparty Available";
    }

    // Create data validation rule
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true)
      .build();

    dataValidations.push([rule]); // Add rule as a single-element array for 2D structure
    valuesToSet.push([defaultOption]); // Default value for the cell
  });

  // Apply dropdowns and default values in bulk
  const range = cashFlowSheet.getRange(2, 18, cashFlowData.length, 1); // Column R
  range.setDataValidations(dataValidations);
  range.setValues(valuesToSet);

  console.log("Dropdowns successfully populated.");
}

function getFromDropdownOptions(columnQValue) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Fetch all necessary data
  const counterpartiesData = counterpartiesSheet.getRange(2, 2, counterpartiesSheet.getLastRow() - 1, 3).getValues(); // Columns B, C, D

  // Create a Map for faster lookups: { Counterparty (Column B) -> [Counterparty Name (Column D)] }
  const counterpartyMap = new Map();
  counterpartiesData.forEach(row => {
    const counterpartyKey = row[0]; // Column B
    const counterpartyValue = row[2]; // Column D
    if (counterpartyKey && counterpartyValue) {
      if (!counterpartyMap.has(counterpartyKey)) {
        counterpartyMap.set(counterpartyKey, []);
      }
      counterpartyMap.get(counterpartyKey).push(counterpartyValue);
    }
  });

  // Get unique and filtered options for Column R
  let options = [];
  if (columnQValue && counterpartyMap.has(columnQValue)) {
    options = [...new Set(counterpartyMap.get(columnQValue))].sort((a, b) => a.localeCompare(b)); // Unique and sorted
  }

  return options.length > 0 ? options : ["No Counterparty Available"];
}

//Column S: FROM_ACCOUNT///////
function getAccountOptions(combinedKeys) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const counterpartiesSheet = spreadsheet.getSheetByName("API - Counterparties");

  // Split keys into components
  const parsedKeys = combinedKeys.map(key => key.split("¦¦"));

  const accounts = counterpartiesSheet.getRange(2, 12, counterpartiesSheet.getLastRow() - 1).getValues(); // Column L
  const payingAgents = counterpartiesSheet.getRange(2, 2, counterpartiesSheet.getLastRow() - 1).getValues(); // Column B
  const fromOptions = counterpartiesSheet.getRange(2, 4, counterpartiesSheet.getLastRow() - 1).getValues(); // Column D
  const currencies = counterpartiesSheet.getRange(2, 11, counterpartiesSheet.getLastRow() - 1).getValues(); // Column K

  // Gather options matching any key
  const options = accounts
    .map((accountRow, index) => {
      for (const [toValue, fromValue, ccyValue] of parsedKeys) {
        if (
          payingAgents[index][0] === toValue &&
          fromOptions[index][0] === fromValue &&
          (currencies[index][0] === ccyValue || ccyValue === "ALL")
        ) {
          return accountRow[0];
        }
      }
      return null;
    })
    .filter(option => option !== null); // Filter out nulls

  return [...new Set(options)]; // Return unique values
}

//Column T: PAYING_AGENT///////////
function populatePayingAgentOptions() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const assetsSheet = spreadsheet.getSheetByName("API - Assets");

  // Fetch unique values from Column B (API - Assets)
  const assetsData = assetsSheet.getRange(2, 2, assetsSheet.getLastRow() - 1).getValues(); // Column B
  const uniqueOptions = [...new Set(assetsData.flat())] // Flatten and get unique
    .filter(option => option && option.trim() !== ""); // Remove empty strings or spaces

  return uniqueOptions.sort(); // Return sorted options in ascending order
}
//Column U: PA_ACCOUNT///////////
function getPAAccountOptions(combinedKey) {
    const [payingAgent, ccy, activeStatus] = combinedKey.split("¦¦");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const accountsSheet = spreadsheet.getSheetByName("API - Accounts");

    // Fetch data from the relevant columns
    const payingAgentData = accountsSheet.getRange("A2:A").getValues().flat();
    const ccyData = accountsSheet.getRange("E2:E").getValues().flat();
    const statusData = accountsSheet.getRange("F2:F").getValues().flat();
    const accountIDs = accountsSheet.getRange("J2:J").getValues().flat();

    // Filter accounts based on criteria
    const matchingAccounts = accountIDs.filter((_, index) => 
        payingAgentData[index] === payingAgent &&
        ccyData[index] === ccy &&
        statusData[index] === activeStatus
    );

    return matchingAccounts;
}

// GXoogle Apps Script Backend File
function saveData(data) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const cashFlowSheet = spreadsheet.getSheetByName("Cash Flow");
    
    if (!cashFlowSheet) {
        throw new Error("Cash Flow sheet not found.");
    }
    
    // Append data to the sheet
    cashFlowSheet.appendRow([
        data.ID, 
        data.DATA_ENTRY_DATE, 
        data.DOCUMENT_DATE, 
        data.PAYMENT_DUE_DATE, 
        data.STATUS, 
        data.CATEGORY, 
        data.COUNTERPART, 
        data.REFERENCE, 
        data.CCY, 
        data.AMOUNT, 
        data.PURPOSE, 
        data.PAYMENT_MODE, 
        data.DEBIT_CREDIT, 
        data.BANK
    ]);

    return "Data saved successfully.";
}

function uploadFiles(files, rowId) {
    const folderId = "1gAb75yXrJnmo7AKeEVkPtERYhJ07-4BT"; // Replace with your folder ID
    const folder = DriveApp.getFolderById(folderId);

    if (!folder) {
        throw new Error("Destination folder not found.");
    }

    const uploadedFiles = [];
    files.forEach(file => {
        try {
            const blob = Utilities.newBlob(Utilities.base64Decode(file.bytes), file.type, file.name);
            const fileName = `${rowId}__${new Date().toISOString().slice(0, 7).replace("-", "")}_${file.name}`;
            const uploadedFile = folder.createFile(blob).setName(fileName);
            uploadedFiles.push(uploadedFile.getUrl());
        } catch (err) {
            Logger.log(`Error uploading file ${file.name}: ${err.message}`);
        }
    });

    return uploadedFiles;
}

function saveDataAndUpload(data, files) {
    let saveResult, uploadedFiles;

    try {
        saveResult = saveData(data);
    } catch (err) {
        throw new Error(`Failed to save data: ${err.message}`);
    }

    try {
        uploadedFiles = uploadFiles(files, data.ID);
    } catch (err) {
        throw new Error(`Failed to upload files: ${err.message}`);
    }

    return {
        saveResult,
        uploadedFiles
    };
}


////////////////Upload
function XsaveDataAndUpload(data, files) {
    const folderId = "1gAb75yXrJnmo7AKeEVkPtERYhJ07-4BT"; // Fixed folder ID
    const folder = DriveApp.getFolderById(folderId);

    if (!folder) {
        throw new Error("Destination folder not found.");
    }

    const uploadedFiles = [];
    if (files && files.length > 0) {
        files.forEach(file => {
            const blob = Utilities.newBlob(Utilities.base64Decode(file.content), file.type, file.name);
            const fileName = `${data.ID}_${new Date().toISOString().slice(0, 10)}_${file.name}`;
            const uploadedFile = folder.createFile(blob).setName(fileName);
            uploadedFiles.push(uploadedFile.getUrl());
        });
    }

    saveCashFlowData(data); // Save form data to the spreadsheet

    return {
        success: true,
        message: "Data and files uploaded successfully!",
        uploadedFiles,
    };
}

function XsaveCashFlowData(data) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Cash Flow");

    if (!sheet) {
        throw new Error("Cash Flow sheet not found.");
    }

    const lastRow = sheet.getLastRow() + 1;

    sheet.appendRow([
        data.ID,
        data.DATA_ENTRY_DATE,
        data.DOCUMENT_DATE,
        data.PAYMENT_DUE_DATE,
        data.STATUS,
        data.GROUP,
        data.CATEGORY,
        data.COUNTERPART,
        data.REFERENCE,
        data.CCY,
        data.VAT,
        data.AMOUNT,
        data.INSTALLMENT,
        data.PAYMENT_MODE,
        data.PURPOSE,
        data.STATUS,
        data.TO,
        data.FROM,
        data.FROM_ACCOUNT,
        data.PAYING_AGENT,
        data.PA_ACCOUNT,
        data.BANK,
        data.DEBIT_CREDIT,
        "", // Placeholder for LINK if needed
    ]);

    Logger.log("Form data saved successfully.");
}

// Upload files to Google Drive
function uploadFiles(files, rowId) {
    const folderId = "your-folder-id"; // Replace with your actual folder ID
    const folder = DriveApp.getFolderById(folderId);

    if (!folder) {
        throw new Error("Destination folder not found.");
    }

    const uploadedFiles = files.map(file => {
        const blob = Utilities.newBlob(Utilities.base64Decode(file.content), file.type, file.name);
        const fileName = `${rowId}_${new Date().toISOString().slice(0, 10)}_${file.name}`;
        const uploadedFile = folder.createFile(blob).setName(fileName);
        return uploadedFile.getUrl();
    });

    Logger.log("Files uploaded successfully.");
    return uploadedFiles;
}

///////////////////////////////////
function saveDataAndUpload(data, files) {
    const folderId = "1gAb75yXrJnmo7AKeEVkPtERYhJ07-4BT"; // Fixed folder ID
    const folder = DriveApp.getFolderById(folderId);

    if (!folder) {
        throw new Error("Destination folder not found.");
    }

    const uploadedFiles = files.map(file => {
        const blob = Utilities.newBlob(Utilities.base64Decode(file.content), file.type, file.name);
        const fileName = `${data.ID}_${new Date().toISOString().slice(0, 10)}_${file.name}`;
        const uploadedFile = folder.createFile(blob).setName(fileName);
        return {
            name: uploadedFile.getName(),
            url: uploadedFile.getUrl()
        };
    });

    saveCashFlowData(data, uploadedFiles); // Pass the uploaded files info to saveCashFlowData

    return {
        success: true,
        message: "Data and files uploaded successfully!",
        uploadedFiles,
    };
}

function saveCashFlowData(data, uploadedFiles) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Cash Flow");

    if (!sheet) {
        throw new Error("Cash Flow sheet not found.");
    }

    const lastRow = sheet.getLastRow() + 1;

    // Append the data to the sheet
    sheet.appendRow([
        data.ID,
        data.DATA_ENTRY_DATE,
        data.DOCUMENT_DATE,
        data.PAYMENT_DUE_DATE,
        data.STATUS,
        data.GROUP,
        data.CATEGORY,
        data.COUNTERPART,
        data.REFERENCE,
        data.CCY,
        data.VAT,
        data.AMOUNT,
        data.INSTALLMENT,
        data.PAYMENT_MODE,
        data.PURPOSE,
        data.STATUS,
        data.TO,
        data.FROM,
        data.FROM_ACCOUNT,
        data.PAYING_AGENT,
        data.PA_ACCOUNT,
        data.BANK,
        data.DEBIT_CREDIT,
        "" // Placeholder for LINK column
    ]);

    // Create rich text values with hyperlinks
    const richTextValues = uploadedFiles.map(file => {
        return SpreadsheetApp.newRichTextValue()
            .setText(file.name)
            .setLinkUrl(file.url)
            .build();
    });

    // Insert hyperlinks into the LINK column
    const linkCell = sheet.getRange(lastRow, 24); // 24 corresponds to column X (LINK)
    if (richTextValues.length === 1) {
        linkCell.setRichTextValue(richTextValues[0]);
    } else {
        // If multiple files, concatenate names with commas and set as rich text
        const combinedText = richTextValues.map(rt => rt.getText()).join(", ");
        const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(combinedText);
        let currentPos = 0;
        richTextValues.forEach(rt => {
            const text = rt.getText();
            richTextBuilder.setLinkUrl(currentPos, currentPos + text.length, rt.getLinkUrl());
            currentPos += text.length + 2; // Account for ", "
        });
        linkCell.setRichTextValue(richTextBuilder.build());
    }

    Logger.log("Form data and file links saved successfully.");
}


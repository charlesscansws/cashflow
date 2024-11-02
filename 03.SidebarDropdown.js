function getAccountNamesOption() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');

    if (!sheet) {
    Logger.log('Sheet not found');
    return [];
  }

  // Adjust the range based on your specific data layout

  const dataRange = sheet.getRange('B2:B' + sheet.getLastRow()).getValues(); // Fetch data from column B
  const accountNames = dataRange.flat().filter(name => name !== ""); // Flatten the array and filter out empty strings
  //const accountNames = "L'Ecurie Swiss";
  Logger.log(accountNames); // For debugging
  return accountNames; // Return array of account names
}

function executeForAllAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const dataRange = sheet.getDataRange().getValues(); // Get all data from the sheet

  // Iterate over each row, starting from row 2 (index 1)
  for (let i = 1; i < dataRange.length; i++) {
    const accountName = dataRange[i][1]; // Assuming B column is index 1
    const clientAssertion = dataRange[i][2]; // Assuming C column is index 2
    const refreshToken = dataRange[i][3]; // Assuming D column is index 3

    if (accountName) {
      // Execute function for each account using the accountName, clientAssertion, and refreshToken
      Logger.log(`Executing function for account: ${accountName}`);
      // Add your specific function here
    }
  }
}
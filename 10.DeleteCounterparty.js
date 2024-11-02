// Open the sidebar
function openDeleteCounterpartySidebar() {
  var html = HtmlService.createHtmlOutputFromFile('DeleteCounterpartyForm')
    .setWidth(800)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Delete Counterparty');
}

// Fetch unique account and counterparty names for dropdown filters
function getDropdownData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const accountNames = [...new Set(sheet.getRange("A2:A").getValues().flat())].filter(name => name);
  const counterpartyNames = [...new Set(sheet.getRange("G2:G").getValues().flat())].filter(name => name);

  return {
    accounts: accountNames,
    counterparties: counterpartyNames
  };
}

// Retrieve counterparties based on selected account and counterparty filters
function getFilteredCounterparties(accountName, counterpartyName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const data = sheet.getDataRange().getValues().slice(1); // Exclude header row

  const filteredData = data.filter(row => 
    (accountName ? row[0] === accountName : true) &&
    (counterpartyName ? row[6] === counterpartyName : true)
  ).map(row => ({
    counterparty_id: row[1],  // Assuming counterparty ID is in column B
    account_name: row[0],     // Account name in column A
    counterparty_name: row[6] // Counterparty name in column G
  }));

  return filteredData;
}

// Delete selected counterparties using Revolut API
function deleteCounterparties(counterpartyIds) {
  const token = getAuthToken();  // Replace with actual token retrieval method

  counterpartyIds.forEach(id => {
    const url = `https://b2b.revolut.com/api/1.0/counterparty/${id}`;
    const options = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    try {
      UrlFetchApp.fetch(url, options);
    } catch (error) {
      console.error(`Failed to delete counterparty ${id}:`, error);
    }
  });
}
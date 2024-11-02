// Open the sidebar
function openDeleteCounterpartySidebar() {
  const html = HtmlService.createHtmlOutputFromFile('DeleteCounterpartyForm')
      .setTitle('Delete Counterparty');
  SpreadsheetApp.getUi().showSidebar(html);
}

// Retrieve account names and counterparty names for filters
function getCounterpartyFilters() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const accountNames = [...new Set(sheet.getRange("A2:A").getValues().flat())];
  const counterpartyNames = [...new Set(sheet.getRange("G2:G").getValues().flat())];
  
  return { accountNames, counterpartyNames };
}

// Retrieve filtered counterparties
function getFilteredCounterparties(account, counterparty) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const data = sheet.getDataRange().getValues().slice(1); // Skip header row
  
  const filteredData = data.filter(row => 
    (account ? row[0] === account : true) &&
    (counterparty ? row[6] === counterparty : true)
  ).map(row => ({
    counterparty_id: row[1], // Assuming ID is in column B
    account_name: row[0], // Assuming account name is in column A
    counterparty_name: row[6] // Assuming counterparty name is in column G
  }));

  return filteredData;
}

// Delete selected counterparties using Revolut API
function deleteCounterparties(counterpartyIds) {
  const token = 'YOUR_AUTH_TOKEN'; // Replace with your actual token
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

var Contact = "👤 Contact";          
var spreadsheet= SpreadsheetApp.getActiveSpreadsheet();
var contactSheet = spreadsheet.getSheetByName(Contact);

function createContactSheet() {  
  if (contactSheet == null) {
    contactSheet = spreadsheet.insertSheet(Contact);
    var numRows = contactSheet.getMaxRows() - 11;
    contactSheet.deleteRows(12, numRows);
    contactSheetLayout();
    createHeaderContactSheet();

  }
}

function createHeaderContactSheet() {
  contactSheet.getRange("A1:G1").setValues([["Category", "Group","Title", "First Name", "Last Name","eMail","Info"]]);
}


  function contactSheetLayout() {

  // Define the zones for Zone (columns O to U)
  var zones = [
    { name: "To:", columns: 7, colorBase: "#b4c5fa" },
  ];

  var startRow = 1; // Start from row 2
  var startCol = 1; // Start from column O
  var numRows = contactSheet.getMaxRows() - startRow; // Calculate the number of rows excluding the last row

  // Loop through the single zone for Zone 2 and apply formatting
  for (var i = 0; i < zones.length; i++) {
    var zone = zones[i];
    var color = zone.colorBase;

    // Set the background color for the entire zone
    contactSheet.getRange(startRow, startCol, numRows, zone.columns).setBackground(color);

    // Apply alternating row colors (starting from row 3)
    for (var row = 2; row <= numRows + 2; row += 2) {
      contactSheet.getRange(startRow + row - 2, startCol, 1, zone.columns).setBackground("#FFFFFF");
    }

    // Add a label for the zone
    //contactSheet.getRange(startRow, startCol).setValue(zone.name);

    startCol += zone.columns;
  }

  // Set the column widths for Zone
  //Width
  contactSheet.setColumnWidth(1, 120); // Adjust the width as desired for A
  contactSheet.setColumnWidth(2, 120); // Adjust the width as desired for B
  contactSheet.setColumnWidth(3, 30); // Adjust the width as desired for C
  contactSheet.setColumnWidth(4, 120); // Adjust the width as desired for D
  contactSheet.setColumnWidth(5, 120); // Adjust the width as desired for E
  contactSheet.setColumnWidth(6, 180); // Adjust the width as desired for A
  contactSheet.setColumnWidth(7, 250); // Adjust the width as desired for B
  // Set Lines for Zone
  const rangeList = contactSheet.getRange(2, 1, numRows, 7);
  rangeList.setBorder(true, true, true, true, true, true, "white", SpreadsheetApp.BorderStyle.SOLID);

  rangeList.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP); // Wrapping text in cells
  rangeList.setHorizontalAlignment("left").setVerticalAlignment("middle"); // Alignment middle left

    // Set Header for Zone
  const rangeHeader2 = contactSheet.getRange(1, 1, 1, 7);
  rangeHeader2.setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID);
  rangeHeader2.setBackgroundColor('#000000');
  rangeHeader2.setFontColor("#ffffff");
  rangeHeader2.setHorizontalAlignment("left").setVerticalAlignment("middle"); // Alignment middle left

}

  function reorderEmailContact() {
   var Relation = "👤 Contact";
   var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   var relationSheet = spreadsheet.getSheetByName(Relation);
              
   // Assuming data starts from row 2 in columns A to G
   var range = relationSheet.getRange("A2:G");

   // Sort based on specified column (F=6 when 1-based index)
   range.sort({column: 6, ascending: true});
}
  function reorderLastNameContact() {
   var Relation = "👤 Contact";
   var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   var relationSheet = spreadsheet.getSheetByName(Relation);
              
   // Assuming data starts from row 2 in columns A to G
   var range = relationSheet.getRange("A2:G");

   // Sort based on specified column (E=5 when 1-based index)
   range.sort({column: 5, ascending: true});
}

function reorderCategoryGroup() {
   var Relation = "👤 Contact";
   var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   var relationSheet = spreadsheet.getSheetByName(Relation);
              
   // Assuming data starts from row 2 in columns A to G
   var range = relationSheet.getRange("A2:G");

   // Sort based on specified columns (A=1, B=2 when 1-based index)
   range.sort([
    {column: 1, ascending: true},
    {column: 2, ascending: true}
   ]);
}

function reorderGroupCategory() {
   var Relation = "👤 Contact";
   var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   var relationSheet = spreadsheet.getSheetByName(Relation);
              
   // Assuming data starts from row 2 in columns A to G
   var range = relationSheet.getRange("A2:G");

   // Sort based on specified columns (A=1, B=2 when 1-based index)
   range.sort([
    {column: 2, ascending: true},
    {column: 1, ascending: true}
   ]);
}
//Remove duplicate
function removeDuplicates() {
  var Relation = "👤 Contact";
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var relationSheet = spreadsheet.getSheetByName(Relation);

  // Dynamically determine last row with data in column F
  var lastRow = relationSheet.getLastRow();
  
  // Get the data range
  var dataRange = relationSheet.getRange(1, 1, lastRow, 7); // Assuming A1:G is your range

  // Get values from the range
  var data = dataRange.getValues();

  // Create a map to track seen email addresses
  var seenEmails = {};
  var rowsToDelete = [];

  // Iterate through the data to mark rows for deletion
  for (var i = lastRow - 1; i >= 0; i--) {
    var email = data[i][5]; // Assuming email addresses are in the 6th column (index 5)
    if (seenEmails[email]) {
      // Duplicate found, mark the row for deletion
      rowsToDelete.push(i + 1); // Corrected index calculation
    } else {
      seenEmails[email] = true;
    }
  }

  // Delete marked rows
  rowsToDelete.forEach(function(row) {
    relationSheet.deleteRow(row);
  });
}


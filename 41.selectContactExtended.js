// Function to get data from the spreadsheet
function getRelationDataRelation() {
  var Relation = "👤 Contact";          
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var relationSheet = spreadsheet.getSheetByName(Relation);
  var data = relationSheet.getRange(2, 1, relationSheet.getLastRow() - 1, 7).getValues();
  return data;
}

// Function to import selected data to the active spreadsheet
function importSelectedRelationData(selectedRows, targetColumnRange) {
  return new Promise((resolve, reject) => {
    try {
      var Relation = "👤 Contact";
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var relationSheet = spreadsheet.getSheetByName(Relation);
      var targetSheet = spreadsheet.getActiveSheet();

      // Ensure selectedRows is an array
      if (!Array.isArray(selectedRows)) {
        // Handle the case where selectedRows is not an array
        selectedRows = [selectedRows];
      }

      // Ensure selectedRows is not empty
      if (selectedRows.length === 0) {
        throw new Error('No row selected for import');
      }

      // Determine the last non-empty row in the target range P2:V
      var targetRange = targetSheet.getRange("P2:V");
      var values = targetRange.getValues();
      var lastRow = values.length;
      while (lastRow > 0 && values[lastRow - 1].every(cell => cell === '')) {
        lastRow--;
      }

      // If the last row is completely empty, set it to 1 to append at the bottom
      if (lastRow === 0) {
        lastRow = 1;
      } else {
        // If the last row is not empty, set it to the next row
        lastRow++;
      }

      // Ensure targetColumnRange is not empty
      if (!targetColumnRange || !targetColumnRange.start || !targetColumnRange.end) {
        throw new Error('Target column range is not specified');
      }

      // Get all values at once
      var values = relationSheet.getRange(2, 1, relationSheet.getLastRow() - 1, 7).getValues();

      // Loop through selected rows and get data
      var dataToImport = selectedRows.map(function (index) {
        // Ensure the index is within the valid range
        if (index >= 0 && index < values.length) {
          return values[index];
        } else {
          throw new Error('Invalid row index: ' + index);
        }
      });

      // Remove any null values from dataToImport
      dataToImport = dataToImport.filter(function (row) {
        return row !== null;
      });

      // Paste the selected data below the last non-empty row in the target columns
      if (dataToImport.length > 0) {
        var targetRange = targetSheet.getRange(lastRow + 1, targetColumnRange.start, dataToImport.length, targetColumnRange.end - targetColumnRange.start + 1);
        targetRange.setValues(dataToImport);
        console.log('Import successful');
        resolve();
      } else {
        throw new Error('No valid rows selected for import');
      }
    } catch (error) {
      // Log the error details
      console.error('Import failed:', error);
      reject(error);
    }
  });
}

// Function to open the modal and populate it with data
function openModalWithDataRelation() {
  var data = getRelationDataRelation(); // Call the function to get the data
  var header = ["Category", "Group", "Title", "First Name", "Last Name", "eMail", "Info"];
  var categories = [...new Set(data.map(row => row[0]))]; // Extract unique categories
  var groups = [...new Set(data.map(row => row[1]))]; // Extract unique groups

  var htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
          label {
            display: block;
          }
          th {
            font-weight: bold;
            font-family: Arial, sans-serif; /* Replace with your desired Google Font */
            text-align: left; /* Align the header text to the left */
          }
          td {
            padding: 5px;
            font-family: Arial, sans-serif; /* Change to 'Arial' or any other desired font */
          }
          .modal-footer {
            display: flex;
            justify-content: space-between;
          }
          .copyright {
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <form id="importRelationForm">
          <div class="row mb-3">
            <div class="col">
              <label for="category">Category:</label>
              <select class="form-control" id="category">
                <option value="">All</option>
                ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}
              </select>
            </div>
            <div class="col">
              <label for="group">Group:</label>
              <select class="form-control" id="group">
                <option value="">All</option>
                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
              </select>
            </div>
            <div class="col">
              <label for="search">Search:</label>
              <input type="text" class="form-control" id="search">
            </div>
            <div class="col">
              <label>&nbsp;</label>
              <button type="button" class="btn btn-primary btn-block" onclick="filterData()">Filter</button>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th></th>
                ${header.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map((row, i) => `
                <tr>
                  <td>
                    <input type="checkbox" name="rowCheckbox" value="${i}">
                  </td>
                  ${row.map(cell => `<td>${cell.replace(/,/g, ' ')}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
          <div class="modal-footer">
            <div>
              <button type="button" class="btn btn-secondary" onclick="selectAll()">Select All</button>
              <button type="button" class="btn btn-primary" onclick="importRelationData()">Import</button>
            </div>
            <div class="copyright">Scans © Copyright, 2024 All Rights Reserved.</div>
          </div>
        </form>
        <script>
          function selectAll() {
            var visibleCheckboxes = document.querySelectorAll('tbody tr:not([style*="display: none;"]) input[name="rowCheckbox"]');
            visibleCheckboxes.forEach(function (checkbox) {
              checkbox.checked = true;
            });
          }

          function filterData() {
            var category = document.getElementById('category').value;
            var group = document.getElementById('group').value;
            var search = document.getElementById('search').value.toLowerCase();

            var rows = document.querySelectorAll('tbody tr');
            rows.forEach(function (row) {
              var rowData = row.innerText.toLowerCase();
              var matchesCategory = category === '' || rowData.includes(category.toLowerCase());
              var matchesGroup = group === '' || rowData.includes(group.toLowerCase());
              var matchesSearch = search === '' || rowData.includes(search);

              if (matchesCategory && matchesGroup && matchesSearch) {
                row.style.display = 'table-row';
              } else {
                row.style.display = 'none';
              }
            });
          }

          function importRelationData() {
              var selectedRows = [];
              var checkboxes = document.getElementsByName('rowCheckbox');
              checkboxes.forEach(function (checkbox, index) {
                if (checkbox.checked) {
                  selectedRows.push(index);
                }
              });

              // Ensure selectedRows is explicitly passed as an array
              google.script.run
                .withSuccessHandler(function () {
                  console.log('Import successful');
                  google.script.host.close();
                })
                .withFailureHandler(function (error) {
                  console.error('Import failed:', error);
                })
                .importSelectedRelationData(selectedRows, { start: 16, end: 22 })
                .then(() => {
                  // Import completed successfully
                  google.script.host.close();
                })
                .catch((error) => {
                  // Import failed
                  console.error('Import failed:', error);
                });
            }
        </script>
      </body>
    </html>`;

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(1000)
    .setHeight(800)
    .setTitle('Select Contacts');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Select Contacts');
}
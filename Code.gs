// ==========================================
// GOOGLE APPS SCRIPT: SECURE FAMILY HEALTH TRACKER (SHEETS)
// ==========================================

// 1. CHANGE THIS PASSWORD to something secure!
const SECRET_PASSWORD = "my-secure-family-password";

// 2. Name of your Spreadsheet in Google Drive
const SPREADSHEET_NAME = "FamilyHealthVault";

const TABS = ["Member", "Checkup", "Medicine", "Vital", "Insurance"];
const HEADERS = ["Timestamp", "Date", "Family_Member", "Detail_1", "Detail_2", "Detail_3", "Report_Link", "Notes"];

// Helper function to verify the password sent from the frontend
function isAuthenticated(providedPassword) {
  return providedPassword === SECRET_PASSWORD;
}

// Initial setup to create the Spreadsheet and Tabs if it doesn't exist
function setup() {
  let files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (!files.hasNext()) {
    let ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    
    // Create all necessary tabs
    TABS.forEach(tab => {
      let sheet = ss.insertSheet(tab);
      sheet.appendRow(HEADERS);
      // Freeze the header row for better visibility in Sheets
      sheet.setFrozenRows(1);
    });
    
    // Remove the default "Sheet1" created by Google
    let defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet) {
      ss.deleteSheet(defaultSheet);
    }
    
    Logger.log("Created new secure Spreadsheet: " + SPREADSHEET_NAME);
  } else {
    Logger.log("Secure Spreadsheet already exists.");
  }
}

function getSpreadsheet() {
  let files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return null;
}

function doGet(e) {
  // REQUIRE PASSWORD FOR GET REQUESTS
  const providedPassword = e.parameter.pwd;

  if (!isAuthenticated(providedPassword)) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized. Incorrect password." }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    let ss = getSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Spreadsheet not found. Please run setup() in Apps Script." }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    let jsonData = [];
    
    // Read data from every tab
    TABS.forEach(tab => {
      let sheet = ss.getSheetByName(tab);
      if (sheet) {
        let data = sheet.getDataRange().getValues();
        if (data.length > 1) { // Ignore if only headers exist
          let headers = data[0];
          for (let i = 1; i < data.length; i++) {
            // Re-inject the 'Type' property into the JSON so the frontend doesn't break
            let rowObj = { "Type": tab };
            
            let hasData = false;
            for (let j = 0; j < headers.length; j++) {
              let val = data[i][j];
              // Format dates correctly if Google Sheets parsed them as Date objects
              if (val instanceof Date) {
                // If it's the "Date" column, just get YYYY-MM-DD
                if (headers[j] === "Date") {
                  let month = String(val.getMonth() + 1).padStart(2, '0');
                  let day = String(val.getDate()).padStart(2, '0');
                  val = `${val.getFullYear()}-${month}-${day}`;
                } else if (headers[j] === "Timestamp") {
                  val = val.toISOString();
                }
              }
              rowObj[headers[j]] = val;
              if (String(val).trim() !== "") hasData = true;
            }
            
            // Only push if the row isn't completely empty
            if (hasData) jsonData.push(rowObj);
          }
        }
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: jsonData }))
                         .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Handle CORS Preflight Requests automatically sent by browsers
  if (typeof e === 'undefined' || !e.postData) {
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Parse incoming JSON payload
    let payload = JSON.parse(e.postData.contents);
    
    // REQUIRE PASSWORD FOR POST REQUESTS
    if (!isAuthenticated(payload.pwd)) {
       return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized. Incorrect password." }))
                            .setMimeType(ContentService.MimeType.JSON);
    }

    let ss = getSpreadsheet();
    if (!ss) {
      setup(); // Auto-create if missing
      ss = getSpreadsheet();
    }
    
    // Determine which tab to write to
    let type = payload.type || "Checkup";
    let sheet = ss.getSheetByName(type);
    
    // Failsafe: Create tab if it somehow got deleted
    if (!sheet) {
      sheet = ss.insertSheet(type);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    
    let newRow = [
      payload.timestamp || new Date().toISOString(),
      payload.date || "",
      payload.member || "",
      payload.detail1 || "",
      payload.detail2 || "",
      payload.detail3 || "",
      payload.link || "",
      payload.notes || ""
    ];
    
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Required to handle CORS OPTIONS requests gracefully
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
}